# backend/tasks/utils.py
from collections import defaultdict

def find_all_dependencies():
    """
    Get all dependencies as a dictionary for quick lookup.
    Returns: {task_id: [list_of_dependency_ids]}
    """
    from .models import TaskDependency
    
    dependencies = defaultdict(list)
    all_deps = TaskDependency.objects.select_related('task', 'depends_on').all()
    
    for dep in all_deps:
        dependencies[dep.task.id].append(dep.depends_on.id)
    
    return dict(dependencies)


def check_circular_dependency(task_id, depends_on_id, dependencies=None):
    """
    Check if adding a dependency creates a circular dependency.
    
    Using DFS (Depth-First Search) algorithm.
    We check: can we reach the original task from the depends_on task?
    If yes, then it's a circular dependency.
    
    Args:
        task_id: The ID of the task that wants a new dependency
        depends_on_id: The ID of the task it depends on
        dependencies: Optional pre-fetched dependency dictionary
    
    Returns:
        (has_circle, path): tuple of (boolean, list)
    """
    if dependencies is None:
        dependencies = find_all_dependencies()
    
    # A task can't depend on itself
    if task_id == depends_on_id:
        return True, [task_id, task_id]
    
    # Use DFS to find if there's a path from depends_on_id to task_id
    visited = set()
    stack = [(depends_on_id, [depends_on_id])]  # (current_node, path)
    
    while stack:
        current_node, path = stack.pop()
        
        # If we found the original task, it's a circle!
        if current_node == task_id:
            return True, path
        
        # Mark as visited
        visited.add(current_node)
        
        # Get all tasks that current_node depends on
        for neighbor in dependencies.get(current_node, []):
            if neighbor not in visited:
                new_path = path + [neighbor]
                stack.append((neighbor, new_path))
    
    # No circular dependency found
    return False, []


def update_task_status_based_on_dependencies(task):
    """
    Update a task's status based on its dependencies.
    
    Rules:
    1. If ALL dependencies are 'completed' → set status to 'in_progress'
    2. If ANY dependency is 'blocked' → set status to 'blocked'
    3. If dependencies exist but not all completed → status remains 'pending'
    4. If NO dependencies → keep current status (can be manually set)
    """
    from .models import Task, TaskDependency
    
    # Get all tasks this task depends on
    dependencies = TaskDependency.objects.filter(task=task)
    
    if not dependencies.exists():
        # No dependencies, status stays as is unless manually changed
        return
    
    # Get all dependency tasks
    dependency_tasks = [dep.depends_on for dep in dependencies]
    
    # Check if ANY dependency is blocked
    if any(dep.status == Task.BLOCKED for dep in dependency_tasks):
        if task.status != Task.BLOCKED:
            task.status = Task.BLOCKED
            task.save()
        return
    
    # Check if ALL dependencies are completed
    all_completed = all(dep.status == Task.COMPLETED for dep in dependency_tasks)
    
    if all_completed:
        # Only set to in_progress if currently pending
        if task.status == Task.PENDING:
            task.status = Task.IN_PROGRESS
            task.save()
    else:
        # Not all completed, set to pending if not already pending or blocked
        if task.status not in [Task.PENDING, Task.BLOCKED]:
            task.status = Task.PENDING
            task.save()