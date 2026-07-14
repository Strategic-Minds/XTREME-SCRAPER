"""
XTREME-SCRAPER Swarm Engine
Asyncio multi-agent swarm with task distribution and aggregation
"""

import asyncio
import json
import time
import uuid
from typing import Callable, Any, Optional
from dataclasses import dataclass, field
from enum import Enum
from .core import scrape, ScrapeConfig

class AgentStatus(Enum):
    IDLE = 'idle'
    RUNNING = 'running'
    DONE = 'done'
    FAILED = 'failed'

@dataclass
class SwarmTask:
    task_id: str = field(default_factory=lambda: str(uuid.uuid4())[:8])
    target_url: str = ''
    config: dict = field(default_factory=dict)
    priority: int = 5
    status: str = 'queued'
    agent_id: Optional[str] = None
    result: Optional[dict] = None
    error: Optional[str] = None
    created_at: float = field(default_factory=time.time)
    started_at: Optional[float] = None
    completed_at: Optional[float] = None
    
    @property
    def duration_ms(self):
        if self.started_at and self.completed_at:
            return int((self.completed_at - self.started_at) * 1000)
        return None

@dataclass
class SwarmAgent:
    agent_id: str
    name: str
    status: AgentStatus = AgentStatus.IDLE
    tasks_completed: int = 0
    tasks_failed: int = 0
    current_task_id: Optional[str] = None
    
class XtremeSwarm:
    """
    Asyncio-powered swarm that runs multiple scrapers in parallel.
    Each agent picks tasks from the queue concurrently.
    Results are aggregated in real-time.
    """
    def __init__(self, num_agents: int = 5, on_progress: Optional[Callable] = None):
        self.num_agents = num_agents
        self.task_queue: asyncio.PriorityQueue = asyncio.PriorityQueue()
        self.agents: dict[str, SwarmAgent] = {}
        self.tasks: dict[str, SwarmTask] = {}
        self.results: list[dict] = []
        self.on_progress = on_progress
        self._running = False
        self._lock = asyncio.Lock()
        
        # Initialize agents
        for i in range(num_agents):
            agent_id = f'XS-{i+1:03d}'
            self.agents[agent_id] = SwarmAgent(
                agent_id=agent_id,
                name=f'Scraper Agent {i+1}'
            )
    
    async def add_target(self, url: str, priority: int = 5, **scrape_kwargs) -> SwarmTask:
        task = SwarmTask(target_url=url, config=scrape_kwargs, priority=priority)
        self.tasks[task.task_id] = task
        await self.task_queue.put((priority, task.task_id))
        return task
    
    async def _agent_loop(self, agent: SwarmAgent):
        while self._running:
            try:
                priority, task_id = await asyncio.wait_for(self.task_queue.get(), timeout=2.0)
            except asyncio.TimeoutError:
                continue
            except asyncio.CancelledError:
                break
            
            task = self.tasks.get(task_id)
            if not task:
                self.task_queue.task_done()
                continue
            
            # Claim task
            async with self._lock:
                agent.status = AgentStatus.RUNNING
                agent.current_task_id = task_id
                task.status = 'running'
                task.agent_id = agent.agent_id
                task.started_at = time.time()
            
            if self.on_progress:
                await self.on_progress({'event': 'task_started', 'task_id': task_id, 'agent_id': agent.agent_id, 'url': task.target_url})
            
            try:
                result = await scrape(task.target_url, **task.config)
                async with self._lock:
                    task.status = 'done'
                    task.result = result
                    task.completed_at = time.time()
                    agent.status = AgentStatus.IDLE
                    agent.tasks_completed += 1
                    agent.current_task_id = None
                    self.results.append(result)
                if self.on_progress:
                    await self.on_progress({'event': 'task_done', 'task_id': task_id, 'agent_id': agent.agent_id, 'pages': result.get('pages_count',0)})
            except Exception as e:
                async with self._lock:
                    task.status = 'failed'
                    task.error = str(e)[:200]
                    task.completed_at = time.time()
                    agent.status = AgentStatus.IDLE
                    agent.tasks_failed += 1
                    agent.current_task_id = None
                if self.on_progress:
                    await self.on_progress({'event': 'task_failed', 'task_id': task_id, 'error': str(e)[:100]})
            finally:
                self.task_queue.task_done()
    
    async def run(self, targets: list[str], **default_config) -> dict:
        self._running = True
        # Add all targets
        for i, url in enumerate(targets):
            await self.add_target(url, priority=i, **default_config)
        # Start agents
        agent_tasks = []
        for agent in self.agents.values():
            t = asyncio.create_task(self._agent_loop(agent))
            agent_tasks.append(t)
        # Wait for queue to drain
        await self.task_queue.join()
        self._running = False
        for t in agent_tasks:
            t.cancel()
        await asyncio.gather(*agent_tasks, return_exceptions=True)
        return self.status_report()
    
    def status_report(self) -> dict:
        tasks_list = [{
            'task_id': t.task_id,
            'url': t.target_url,
            'status': t.status,
            'agent': t.agent_id,
            'duration_ms': t.duration_ms,
            'pages': t.result.get('pages_count',0) if t.result else 0,
            'error': t.error,
        } for t in self.tasks.values()]
        
        return {
            'total_tasks': len(self.tasks),
            'completed': sum(1 for t in self.tasks.values() if t.status=='done'),
            'failed': sum(1 for t in self.tasks.values() if t.status=='failed'),
            'total_pages': sum(t.result.get('pages_count',0) for t in self.tasks.values() if t.result),
            'agents': [{'id': a.agent_id, 'name': a.name, 'status': a.status.value, 'completed': a.tasks_completed, 'failed': a.tasks_failed} for a in self.agents.values()],
            'tasks': tasks_list,
            'results': self.results,
        }

async def run_swarm(targets: list[str], num_agents: int = 5, **kwargs) -> dict:
    swarm = XtremeSwarm(num_agents=num_agents)
    return await swarm.run(targets, **kwargs)

if __name__ == '__main__':
    targets = ['https://apollo.io', 'https://apollo.io/pricing', 'https://apollo.io/about']
    result = asyncio.run(run_swarm(targets, num_agents=3, max_pages=20))
    print(json.dumps({'completed': result['completed'], 'total_pages': result['total_pages'], 'agents': result['agents']}, indent=2))
