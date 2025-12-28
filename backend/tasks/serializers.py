# backend/tasks/serializers.py - CORRECTED VERSION
from rest_framework import serializers
from .models import Task, TaskDependency
from .utils import check_circular_dependency, update_task_status_based_on_dependencies

class TaskSerializer(serializers.ModelSerializer):
    dependency_count = serializers.SerializerMethodField()
    dependent_count = serializers.SerializerMethodField()
    
    class Meta:
        model = Task
        fields = [
            'id', 'title', 'description', 'status',
            'created_at', 'updated_at',
            'dependency_count', 'dependent_count'
        ]
        read_only_fields = ['created_at', 'updated_at']
    
    def get_dependency_count(self, obj):
        return obj.dependencies.count()
    
    def get_dependent_count(self, obj):
        return obj.dependents.count()
    
    def update(self, instance, validated_data):
        # Get the original status before update
        old_status = instance.status
        new_status = validated_data.get('status', instance.status)
        
        # Update the task
        instance = super().update(instance, validated_data)
        
        # If task status changed to completed, update tasks that depend on it
        if old_status != new_status:
            # Get all tasks that depend on this task
            dependent_tasks_ids = instance.dependents.values_list('task', flat=True)
            
            # Update status of each dependent task
            for task_id in dependent_tasks_ids:
                try:
                    dependent_task = Task.objects.get(id=task_id)
                    update_task_status_based_on_dependencies(dependent_task)
                except Task.DoesNotExist:
                    pass
        
        return instance


class TaskDependencySerializer(serializers.ModelSerializer):
    task_title = serializers.CharField(source='task.title', read_only=True)
    depends_on_title = serializers.CharField(source='depends_on.title', read_only=True)
    
    class Meta:
        model = TaskDependency
        fields = ['id', 'task', 'depends_on', 'task_title', 'depends_on_title', 'created_at']
        read_only_fields = ['created_at']
    
    def validate(self, data):
        task = data.get('task')
        depends_on = data.get('depends_on')
        
        if task and depends_on and task.id == depends_on.id:
            raise serializers.ValidationError(
                {"error": "A task cannot depend on itself."}
            )
        
        if task and depends_on:
            has_circle, path = check_circular_dependency(task.id, depends_on.id)
            
            if has_circle:
                raise serializers.ValidationError({
                    "error": "Circular dependency detected",
                    "path": path
                })
        
        return data
    
    def create(self, validated_data):
        dependency = TaskDependency.objects.create(**validated_data)
        update_task_status_based_on_dependencies(dependency.task)
        return dependency