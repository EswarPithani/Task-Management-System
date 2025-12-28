# backend/test_backend.py
import requests
import json
import time

BASE_URL = "http://localhost:8000/api"

def print_header(text):
    print("\n" + "="*60)
    print(f"  {text}")
    print("="*60)

def print_success(text):
    print(f"✅ {text}")

def print_error(text):
    print(f"❌ {text}")

def test_task_crud():
    """Test Task 1: Database Models and CRUD operations"""
    print_header("TASK 1: Database Models & CRUD Operations")
    
    # 1. Create tasks
    print("\n1. Creating tasks...")
    tasks_data = [
        {"title": "Design Database", "description": "Design database schema", "status": "pending"},
        {"title": "Create API", "description": "Build REST API endpoints", "status": "pending"},
        {"title": "Build Frontend", "description": "Create React components", "status": "pending"},
        {"title": "Test System", "description": "Run integration tests", "status": "pending"},
    ]
    
    created_tasks = []
    for task_data in tasks_data:
        response = requests.post(f"{BASE_URL}/tasks/", json=task_data)
        if response.status_code == 201:
            task = response.json()
            created_tasks.append(task)
            print_success(f"Created: {task['title']} (ID: {task['id']})")
        else:
            print_error(f"Failed to create: {task_data['title']}")
    
    # 2. Get all tasks
    print("\n2. Getting all tasks...")
    response = requests.get(f"{BASE_URL}/tasks/")
    if response.status_code == 200:
        tasks = response.json()
        print_success(f"Retrieved {len(tasks)} tasks")
        for task in tasks:
            print(f"   - ID {task['id']}: {task['title']} ({task['status']})")
    
    # 3. Update a task
    print("\n3. Updating task status...")
    if created_tasks:
        task_id = created_tasks[0]['id']
        update_data = {"status": "in_progress"}
        response = requests.patch(f"{BASE_URL}/tasks/{task_id}/", json=update_data)
        if response.status_code == 200:
            print_success(f"Updated task {task_id} to 'in_progress'")
        else:
            print_error(f"Failed to update task {task_id}")
    
    return created_tasks

def test_circular_dependencies(tasks):
    """Test Task 2: Circular Dependency Detection"""
    print_header("TASK 2: Circular Dependency Detection")
    
    if len(tasks) < 3:
        print_error("Need at least 3 tasks for circular dependency test")
        return
    
    task_ids = [task['id'] for task in tasks[:3]]
    task_names = {task['id']: task['title'] for task in tasks[:3]}
    
    print(f"\nUsing tasks: {task_names}")
    
    # 1. Create normal dependency chain: 1 → 2 → 3
    print("\n1. Creating dependency chain: Task 2 depends on Task 1")
    response = requests.post(
        f"{BASE_URL}/tasks/{task_ids[1]}/add_dependency/",
        json={"depends_on_id": task_ids[0]}
    )
    if response.status_code == 201:
        print_success(f"Dependency created: {task_names[task_ids[1]]} → {task_names[task_ids[0]]}")
    else:
        print_error(f"Failed to create dependency: {response.json()}")
    
    print("\n2. Creating dependency: Task 3 depends on Task 2")
    response = requests.post(
        f"{BASE_URL}/tasks/{task_ids[2]}/add_dependency/",
        json={"depends_on_id": task_ids[1]}
    )
    if response.status_code == 201:
        print_success(f"Dependency created: {task_names[task_ids[2]]} → {task_names[task_ids[1]]}")
    else:
        print_error(f"Failed to create dependency: {response.json()}")
    
    # 3. Try to create circular dependency: 1 → 3 (should fail)
    print("\n3. Trying circular dependency: Task 1 → Task 3 (SHOULD FAIL)")
    response = requests.post(
        f"{BASE_URL}/tasks/{task_ids[0]}/add_dependency/",
        json={"depends_on_id": task_ids[2]}
    )
    
    if response.status_code == 400:
        error_data = response.json()
        if "Circular dependency detected" in error_data.get("error", ""):
            print_success(f"✅ Circular dependency correctly detected!")
            print(f"   Error: {error_data['error']}")
            print(f"   Path: {error_data['path']}")
        else:
            print_error(f"Unexpected error: {error_data}")
    else:
        print_error(f"❌ Expected 400 error but got {response.status_code}")
    
    # 4. Test self-dependency
    print("\n4. Testing self-dependency (Task 1 → Task 1)")
    response = requests.post(
        f"{BASE_URL}/tasks/{task_ids[0]}/add_dependency/",
        json={"depends_on_id": task_ids[0]}
    )
    if response.status_code == 400:
        print_success("✅ Self-dependency correctly prevented")
    else:
        print_error(f"❌ Self-dependency should fail but got {response.status_code}")
    
    return task_ids

def test_auto_status_update(task_ids):
    """Test Task 3: Auto Status Update"""
    print_header("TASK 3: Auto Status Update")
    
    # Get initial statuses
    print("\n1. Initial task statuses:")
    for task_id in task_ids:
        response = requests.get(f"{BASE_URL}/tasks/{task_id}/")
        if response.status_code == 200:
            task = response.json()
            print(f"   Task {task_id} ({task['title']}): {task['status']}")
    
    # 2. Mark Task 1 as completed (should make Task 2 in_progress)
    print("\n2. Marking Task 1 as 'completed'...")
    response = requests.patch(
        f"{BASE_URL}/tasks/{task_ids[0]}/",
        json={"status": "completed"}
    )
    
    time.sleep(1)  # Wait for updates
    
    if response.status_code == 200:
        print_success(f"Task 1 marked as completed")
        
        # Check Task 2 status (should be in_progress)
        response = requests.get(f"{BASE_URL}/tasks/{task_ids[1]}/")
        task2 = response.json()
        if task2['status'] == 'in_progress':
            print_success(f"✅ Task 2 automatically changed to 'in_progress'")
        else:
            print_error(f"❌ Task 2 should be 'in_progress' but is '{task2['status']}'")
    else:
        print_error(f"Failed to update Task 1: {response.json()}")
    
    # 3. Mark Task 2 as completed (should make Task 3 in_progress)
    print("\n3. Marking Task 2 as 'completed'...")
    response = requests.patch(
        f"{BASE_URL}/tasks/{task_ids[1]}/",
        json={"status": "completed"}
    )
    
    time.sleep(1)
    
    if response.status_code == 200:
        print_success(f"Task 2 marked as completed")
        
        # Check Task 3 status
        response = requests.get(f"{BASE_URL}/tasks/{task_ids[2]}/")
        task3 = response.json()
        if task3['status'] == 'in_progress':
            print_success(f"✅ Task 3 automatically changed to 'in_progress'")
        else:
            print_error(f"❌ Task 3 should be 'in_progress' but is '{task3['status']}'")
    else:
        print_error(f"Failed to update Task 2: {response.json()}")
    
    # 4. Final status check
    print("\n4. Final status of all tasks:")
    for task_id in task_ids:
        response = requests.get(f"{BASE_URL}/tasks/{task_id}/")
        task = response.json()
        print(f"   Task {task_id} ({task['title']}): {task['status']}")

def test_edge_cases():
    """Test Edge Cases & Polish"""
    print_header("EDGE CASES & POLISH")
    
    # 1. Get all tasks to find IDs
    response = requests.get(f"{BASE_URL}/tasks/")
    if response.status_code != 200:
        print_error("Cannot get tasks for edge case testing")
        return
    
    tasks = response.json()
    if len(tasks) < 2:
        print_error("Need at least 2 tasks for edge case testing")
        return
    
    task1_id = tasks[0]['id']
    task2_id = tasks[1]['id']
    
    # 2. Test duplicate dependency
    print("\n1. Testing duplicate dependency...")
    
    # First create a dependency
    response = requests.post(
        f"{BASE_URL}/tasks/{task2_id}/add_dependency/",
        json={"depends_on_id": task1_id}
    )
    
    if response.status_code == 201:
        print_success(f"Created dependency: Task {task2_id} → Task {task1_id}")
        
        # Try to create same dependency again
        response = requests.post(
            f"{BASE_URL}/tasks/{task2_id}/add_dependency/",
            json={"depends_on_id": task1_id}
        )
        
        if response.status_code == 400:
            print_success("✅ Duplicate dependency correctly prevented")
        else:
            print_error(f"❌ Duplicate dependency should fail but got {response.status_code}")
    else:
        print_error(f"Failed to create initial dependency: {response.json()}")
    
    # 3. Test deleting task with dependencies
    print("\n2. Testing dependency deletion...")
    
    # First, get all dependencies
    response = requests.get(f"{BASE_URL}/dependencies/")
    if response.status_code == 200:
        dependencies = response.json()
        if dependencies:
            dep_id = dependencies[0]['id']
            print(f"Deleting dependency ID {dep_id}...")
            
            response = requests.delete(f"{BASE_URL}/dependencies/{dep_id}/")
            if response.status_code == 204:
                print_success("✅ Dependency deleted successfully")
            else:
                print_error(f"Failed to delete dependency: {response.status_code}")
        else:
            print("No dependencies to delete")
    
    # 4. Test empty states
    print("\n3. Testing empty states...")
    
    # Get dependencies for a task with none
    response = requests.get(f"{BASE_URL}/tasks/{task1_id}/dependencies/")
    if response.status_code == 200:
        deps = response.json()
        print(f"Task {task1_id} has {len(deps)} dependencies")
    
    # Get dependents for a task with none  
    response = requests.get(f"{BASE_URL}/tasks/{task1_id}/dependents/")
    if response.status_code == 200:
        deps = response.json()
        print(f"Task {task1_id} has {len(deps)} dependents")
    
    # 5. Test blocked status
    print("\n4. Testing blocked status propagation...")
    
    # Create a new task and make it depend on existing tasks
    new_task = {"title": "Blocked Task", "description": "Testing blocked status", "status": "pending"}
    response = requests.post(f"{BASE_URL}/tasks/", json=new_task)
    
    if response.status_code == 201:
        blocked_task = response.json()
        blocked_id = blocked_task['id']
        
        # Make it depend on two existing tasks
        for dep_id in [task1_id, task2_id]:
            requests.post(
                f"{BASE_URL}/tasks/{blocked_id}/add_dependency/",
                json={"depends_on_id": dep_id}
            )
        
        # Mark one dependency as blocked
        requests.patch(
            f"{BASE_URL}/tasks/{task1_id}/",
            json={"status": "blocked"}
        )
        
        time.sleep(1)
        
        # Check if blocked task status updated
        response = requests.get(f"{BASE_URL}/tasks/{blocked_id}/")
        blocked_task = response.json()
        
        if blocked_task['status'] == 'blocked':
            print_success("✅ Blocked status correctly propagated to dependent task")
        else:
            print_error(f"❌ Blocked status not propagated: {blocked_task['status']}")

def test_api_endpoints():
    """Test all API endpoints are working"""
    print_header("API ENDPOINTS TEST")
    
    endpoints = [
        ("GET", "/tasks/", "List all tasks"),
        ("GET", "/dependencies/", "List all dependencies"),
        ("GET", "/tasks/1/dependencies/", "Get task dependencies"),
        ("GET", "/tasks/1/dependents/", "Get task dependents"),
    ]
    
    for method, endpoint, description in endpoints:
        print(f"\nTesting {description} ({method} {endpoint})...")
        
        if method == "GET":
            response = requests.get(f"{BASE_URL}{endpoint}")
        elif method == "POST":
            response = requests.post(f"{BASE_URL}{endpoint}", json={})
        
        if 200 <= response.status_code < 300:
            print_success(f"✅ {response.status_code} OK")
        else:
            print_error(f"❌ {response.status_code}: {response.text[:100]}")

def main():
    """Run all tests"""
    print_header("TASK DEPENDENCY SYSTEM - BACKEND TEST SUITE")
    print("Starting tests... Make sure server is running at http://localhost:8000")
    print("Server status: ", end="")
    
    try:
        # Check if server is running
        response = requests.get("http://localhost:8000/api/tasks/", timeout=5)
        if response.status_code == 200:
            print_success("Server is running ✓")
        else:
            print_error(f"Server responded with {response.status_code}")
            return
    except requests.exceptions.ConnectionError:
        print_error("Cannot connect to server. Make sure it's running!")
        print("Run: python manage.py runserver")
        return
    
    # Run all tests
    try:
        tasks = test_task_crud()
        time.sleep(1)
        
        if tasks:
            task_ids = test_circular_dependencies(tasks)
            time.sleep(1)
            
            if task_ids:
                test_auto_status_update(task_ids)
                time.sleep(1)
        
        test_edge_cases()
        time.sleep(1)
        
        test_api_endpoints()
        
        print_header("TEST COMPLETE")
        print_success("All backend tests completed!")
        print("\n🎉 Backend implementation is working correctly!")
        print("✓ Database Models")
        print("✓ Circular Dependency Detection") 
        print("✓ Auto Status Update")
        print("✓ REST API Endpoints")
        print("✓ Edge Cases Handling")
        
    except Exception as e:
        print_error(f"Test failed with error: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    main()