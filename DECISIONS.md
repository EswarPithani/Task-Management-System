```markdown
# Technical Decisions

## 1. Circular Dependency Detection

### Algorithm Choice: Depth-First Search (DFS)
**Why DFS?**
- DFS is straightforward for cycle detection in directed graphs
- Easier to track the exact path of the cycle
- Time complexity: O(V+E) where V=vertices, E=edges

### Implementation Details
- Start DFS from the `depends_on` task
- Check if we can reach back to the original task
- Store visited path to return to user
- Prevent database save if cycle detected

### Example
If we have A→B→C and try to add C→A:
- DFS starts from C
- Finds path C→B→A
- Returns `True, [3, 2, 1]` (C→B→A)

## 2. Graph Visualization

### Technology: SVG over Canvas
**Why SVG?**
- Easier React integration
- Built-in event handling for interactions
- Scalable without quality loss
- Meets requirement of "no external graph libraries"

### Layout Algorithm
- Simple hierarchical layout
- Nodes positioned in rows/columns based on depth
- Edges drawn with arrow markers
- Color coding by status

## 3. State Management

### Choice: React Hooks (useState, useEffect)
- Problem statement said no Redux/Zustand required
- Local component state sufficient for this scale
- Props drilling managed carefully
- Real-time updates via periodic fetching

## 4. Database Design

### Models
- **Task**: id, title, description, status, timestamps
- **TaskDependency**: task (FK), depends_on (FK), timestamp

### Constraints
- Unique constraint on (task, depends_on) prevents duplicates
- Foreign key cascading for data integrity
- Status choices limited to 4 predefined values

## 5. API Design

### RESTful Endpoints
- Clear separation between tasks and dependencies
- Consistent error responses
- Proper HTTP status codes

### Error Handling
- Circular dependency: 400 with path
- Self-dependency: 400 with message
- Not found: 404
- Validation errors: 400 with details

## 6. Frontend Architecture

### Component Structure
- TaskList: Main container
- TaskItem: Individual task card
- TaskForm: Create/update form
- GraphVisualization: SVG graph
- StatusBadge: Status indicator

### Services
- api.js: Centralized API calls
- Error handling with user-friendly messages

## 7. Performance Considerations

### Backend
- DFS algorithm efficient for up to 100+ tasks
- Database queries optimized with select_related
- Periodic status updates handled efficiently

### Frontend
- SVG rendering optimized
- No unnecessary re-renders
- Debounced API calls where needed

## 8. Trade-offs Made

1. **Simple graph layout** over force-directed: Chose hierarchical for simplicity
2. **Periodic polling** over WebSockets: Simpler implementation for real-time
3. **SQLite for development**: Easier setup, can switch to MySQL for production

## 9. What Could Be Improved

Given more time:
1. Add drag-and-drop for graph nodes
2. Implement force-directed layout
3. Add task priorities and estimated times
4. Export graph as PNG
5. Real-time collaboration features