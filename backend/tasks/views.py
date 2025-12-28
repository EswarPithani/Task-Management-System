# backend/tasks/views.py - SIMPLIFIED VERSION
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from django.shortcuts import get_object_or_404
from .models import Task, TaskDependency
from .serializers import TaskSerializer, TaskDependencySerializer
from .utils import check_circular_dependency, update_task_status_based_on_dependencies

class TaskViewSet(viewsets.ModelViewSet):
    queryset = Task.objects.all().order_by('-created_at')
    serializer_class = TaskSerializer
    permission_classes = [AllowAny]
    
    @action(detail=True, methods=['post'])
    def add_dependency(self, request, pk=None):
        """Add dependency to a task"""
        task = self.get_object()
        depends_on_id = request.data.get('depends_on_id')
        
        if not depends_on_id:
            return Response(
                {"error": "depends_on_id is required"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Get the task to depend on
        depends_on_task = get_object_or_404(Task, id=depends_on_id)
        
        # Check if task depends on itself
        if task.id == depends_on_task.id:
            return Response(
                {"error": "A task cannot depend on itself"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Check for circular dependency
        has_circle, path = check_circular_dependency(task.id, depends_on_task.id)
        if has_circle:
            return Response({
                "error": "Circular dependency detected",
                "path": path
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Check if dependency already exists
        if TaskDependency.objects.filter(task=task, depends_on=depends_on_task).exists():
            return Response({
                "error": "Dependency already exists"
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Create the dependency
        dependency = TaskDependency.objects.create(
            task=task,
            depends_on=depends_on_task
        )
        
        # Update task status
        update_task_status_based_on_dependencies(task)
        
        # Return the created dependency
        serializer = TaskDependencySerializer(dependency)
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    
    @action(detail=True, methods=['get'])
    def dependencies(self, request, pk=None):
        """Get all tasks this task depends on"""
        task = self.get_object()
        dependencies = task.dependencies.all()
        serializer = TaskDependencySerializer(dependencies, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['get'])
    def dependents(self, request, pk=None):
        """Get all tasks that depend on this task"""
        task = self.get_object()
        dependents = task.dependents.all()
        serializer = TaskDependencySerializer(dependents, many=True)
        return Response(serializer.data)

class TaskDependencyViewSet(viewsets.ModelViewSet):
    queryset = TaskDependency.objects.all()
    serializer_class = TaskDependencySerializer
    permission_classes = [AllowAny]
    
    def destroy(self, request, *args, **kwargs):
        """Delete a dependency and update task status"""
        dependency = self.get_object()
        task = dependency.task
        
        # Delete dependency
        self.perform_destroy(dependency)
        
        # Update task status
        update_task_status_based_on_dependencies(task)
        
        return Response(status=status.HTTP_204_NO_CONTENT)