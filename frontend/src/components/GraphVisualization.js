import React, { useState, useEffect, useRef } from 'react';
import { taskAPI, dependencyAPI } from '../services/api';

const GraphVisualization = () => {
    const [tasks, setTasks] = useState([]);
    const [dependencies, setDependencies] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedNode, setSelectedNode] = useState(null);
    const [zoom, setZoom] = useState(1);
    const containerRef = useRef(null);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [tasksRes, depsRes] = await Promise.all([
                taskAPI.getAll(),
                dependencyAPI.getAll()
            ]);
            setTasks(tasksRes.data);
            setDependencies(depsRes.data);
        } catch (error) {
            console.error('Failed to fetch graph data:', error);
        } finally {
            setLoading(false);
        }
    };

    // Returns color based on task status
    const getStatusColor = (status) => {
        const colors = {
            'pending': '#9CA3AF',      // gray
            'in_progress': '#3B82F6',  // blue
            'completed': '#10B981',    // green
            'blocked': '#EF4444'       // red
        };
        return colors[status] || '#9CA3AF';
    };

    // Calculates position for each node in the graph
    const getNodePosition = (index, total) => {
        const containerWidth = containerRef.current?.clientWidth || 800;
        const nodesPerRow = Math.min(5, Math.max(3, Math.floor(containerWidth / 180)));
        const row = Math.floor(index / nodesPerRow);
        const col = index % nodesPerRow;

        const x = 100 + (col * 180);
        const y = 100 + (row * 140);

        return { x, y };
    };

    // Zoom controls
    const handleZoomIn = () => setZoom(prev => Math.min(prev + 0.1, 2));
    const handleZoomOut = () => setZoom(prev => Math.max(prev - 0.1, 0.5));
    const handleResetZoom = () => setZoom(1);

    // Calculate needed SVG size based on nodes
    const calculateSVGDimensions = () => {
        if (tasks.length === 0) return { width: 800, height: 400 };

        let maxX = 0;
        let maxY = 0;

        tasks.forEach((task, index) => {
            const pos = getNodePosition(index, tasks.length);
            maxX = Math.max(maxX, pos.x + 100);
            maxY = Math.max(maxY, pos.y + 100);
        });

        return {
            width: Math.max(800, maxX),
            height: Math.max(400, maxY)
        };
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-96">
                <div className="text-gray-500">Loading graph visualization...</div>
            </div>
        );
    }

    const svgDimensions = calculateSVGDimensions();

    return (
        <div className="graph-container">
            {/* Header with controls */}
            <div className="mb-4 flex justify-between items-center">
                <h3 className="text-lg font-semibold text-gray-800">Task Dependency Graph</h3>
                <div className="flex items-center space-x-3">
                    <div className="text-sm text-gray-600">
                        <span className="font-medium">{tasks.length}</span> tasks •
                        <span className="font-medium ml-1">{dependencies.length}</span> dependencies
                    </div>
                    <div className="flex space-x-1">
                        <button onClick={handleZoomOut} className="px-3 py-1 text-sm bg-gray-100 rounded hover:bg-gray-200" title="Zoom Out">−</button>
                        <button onClick={handleResetZoom} className="px-3 py-1 text-sm bg-gray-100 rounded hover:bg-gray-200 min-w-[60px]">{Math.round(zoom * 100)}%</button>
                        <button onClick={handleZoomIn} className="px-3 py-1 text-sm bg-gray-100 rounded hover:bg-gray-200" title="Zoom In">+</button>
                        <button onClick={fetchData} className="px-3 py-1 text-sm bg-blue-100 text-blue-600 rounded hover:bg-blue-200">Refresh</button>
                    </div>
                </div>
            </div>

            {/* Legend */}
            <div className="mb-4 bg-gray-50 p-3 rounded-lg border">
                <div className="flex flex-wrap items-center justify-between">
                    <div className="flex items-center space-x-6">
                        <div className="flex items-center space-x-4">
                            <div className="flex items-center space-x-1">
                                <div className="w-3 h-3 rounded-full bg-gray-400"></div>
                                <span className="text-sm">Pending</span>
                            </div>
                            <div className="flex items-center space-x-1">
                                <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                                <span className="text-sm">In Progress</span>
                            </div>
                            <div className="flex items-center space-x-1">
                                <div className="w-3 h-3 rounded-full bg-green-500"></div>
                                <span className="text-sm">Completed</span>
                            </div>
                            <div className="flex items-center space-x-1">
                                <div className="w-3 h-3 rounded-full bg-red-500"></div>
                                <span className="text-sm">Blocked</span>
                            </div>
                        </div>
                    </div>
                    <div className="text-sm text-gray-500 mt-2 sm:mt-0">
                        Click any node to see details • Arrows show dependencies
                    </div>
                </div>
            </div>

            {/* Main Graph Area */}
            <div ref={containerRef} className="border rounded-lg bg-white h-[500px] overflow-auto relative">
                {tasks.length === 0 ? (
                    <div className="flex items-center justify-center h-full">
                        <div className="text-center">
                            <p className="text-gray-500 mb-2">No tasks to display</p>
                            <p className="text-sm text-gray-400">Create tasks to see the dependency graph</p>
                        </div>
                    </div>
                ) : (
                    <svg
                        width={svgDimensions.width}
                        height={svgDimensions.height}
                        style={{
                            minWidth: '100%',
                            minHeight: '100%',
                            transform: `scale(${zoom})`,
                            transformOrigin: '0 0'
                        }}
                    >
                        {/* Arrow definition for dependency lines */}
                        <defs>
                            <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
                                <polygon points="0 0, 10 3.5, 0 7" fill="#6B7280" />
                            </marker>
                        </defs>

                        {/* Draw all dependency lines */}
                        {dependencies.map((dep) => {
                            const fromIndex = tasks.findIndex(t => t.id === dep.task);
                            const toIndex = tasks.findIndex(t => t.id === dep.depends_on);

                            if (fromIndex === -1 || toIndex === -1) return null;

                            const fromPos = getNodePosition(fromIndex, tasks.length);
                            const toPos = getNodePosition(toIndex, tasks.length);

                            // Calculate line from edge of circle to edge of circle
                            const dx = toPos.x - fromPos.x;
                            const dy = toPos.y - fromPos.y;
                            const distance = Math.sqrt(dx * dx + dy * dy);
                            const radius = 25;

                            const startX = fromPos.x + (dx / distance) * radius;
                            const startY = fromPos.y + (dy / distance) * radius;
                            const endX = toPos.x - (dx / distance) * radius;
                            const endY = toPos.y - (dy / distance) * radius;

                            const isSelected = selectedNode === dep.task || selectedNode === dep.depends_on;

                            return (
                                <line
                                    key={`edge-${dep.id}`}
                                    x1={startX}
                                    y1={startY}
                                    x2={endX}
                                    y2={endY}
                                    stroke={isSelected ? "#F59E0B" : "#6B7280"}
                                    strokeWidth={isSelected ? 3 : 2}
                                    strokeDasharray={isSelected ? "5,5" : "none"}
                                    markerEnd="url(#arrowhead)"
                                />
                            );
                        })}

                        {/* Draw all task nodes */}
                        {tasks.map((task, index) => {
                            const position = getNodePosition(index, tasks.length);
                            const isSelected = selectedNode === task.id;
                            const nodeSize = isSelected ? 30 : 25;

                            return (
                                <g key={`node-${task.id}`} onClick={() => setSelectedNode(task.id)} className="cursor-pointer">
                                    {/* Task circle */}
                                    <circle
                                        cx={position.x}
                                        cy={position.y}
                                        r={nodeSize}
                                        fill={getStatusColor(task.status)}
                                        stroke={isSelected ? "#000000" : "#FFFFFF"}
                                        strokeWidth={isSelected ? 3 : 2}
                                        className="hover:opacity-90 transition-all"
                                    />

                                    {/* Task ID inside circle */}
                                    <text x={position.x} y={position.y} textAnchor="middle" dy="0.3em" fill="white" fontWeight="bold" fontSize="14" className="select-none">
                                        {task.id}
                                    </text>

                                    {/* Task title below circle */}
                                    <text x={position.x} y={position.y + nodeSize + 20} textAnchor="middle" fill="#374151" fontWeight="500" fontSize="12" className="select-none">
                                        {task.title.length > 12 ? task.title.substring(0, 12) + '...' : task.title}
                                    </text>

                                    {/* Status below title */}
                                    <text x={position.x} y={position.y + nodeSize + 35} textAnchor="middle" fill="#6B7280" fontSize="10" className="select-none">
                                        {task.status.replace('_', ' ')}
                                    </text>
                                </g>
                            );
                        })}
                    </svg>
                )}

                {/* Details panel for selected node */}
                {selectedNode && (() => {
                    const task = tasks.find(t => t.id === selectedNode);
                    if (!task) return null;

                    const taskDeps = dependencies.filter(d => d.task === task.id);
                    const taskDependents = dependencies.filter(d => d.depends_on === task.id);

                    return (
                        <div className="absolute top-4 right-4 bg-white p-4 rounded-lg shadow-lg border max-w-xs z-10">
                            <div className="flex justify-between items-start mb-3">
                                <h4 className="font-medium text-gray-800">Task Details</h4>
                                <button onClick={() => setSelectedNode(null)} className="text-gray-500 hover:text-gray-700 text-lg">×</button>
                            </div>

                            <div className="space-y-3 text-sm">
                                <div>
                                    <div className="text-xs text-gray-500 mb-1">Title</div>
                                    <div className="font-medium">{task.title}</div>
                                </div>

                                <div>
                                    <div className="text-xs text-gray-500 mb-1">Status</div>
                                    <div className="flex items-center space-x-2">
                                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: getStatusColor(task.status) }}></div>
                                        <span className="capitalize">{task.status.replace('_', ' ')}</span>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <div className="text-xs text-gray-500 mb-1">Dependencies</div>
                                        <div className="font-medium">{taskDeps.length}</div>
                                    </div>
                                    <div>
                                        <div className="text-xs text-gray-500 mb-1">Dependents</div>
                                        <div className="font-medium">{taskDependents.length}</div>
                                    </div>
                                </div>

                                {taskDeps.length > 0 && (
                                    <div>
                                        <div className="text-xs text-gray-500 mb-1">Depends On</div>
                                        <div className="space-y-1 max-h-32 overflow-y-auto pr-2">
                                            {taskDeps.map(dep => {
                                                const depTask = tasks.find(t => t.id === dep.depends_on);
                                                return <div key={dep.id} className="text-xs p-1 bg-gray-50 rounded">• {depTask?.title} (ID: {dep.depends_on})</div>;
                                            })}
                                        </div>
                                    </div>
                                )}

                                {taskDependents.length > 0 && (
                                    <div>
                                        <div className="text-xs text-gray-500 mb-1">Dependent Tasks</div>
                                        <div className="space-y-1 max-h-32 overflow-y-auto pr-2">
                                            {taskDependents.map(dep => {
                                                const depTask = tasks.find(t => t.id === dep.task);
                                                return <div key={dep.id} className="text-xs p-1 bg-gray-50 rounded">• {depTask?.title} (ID: {dep.task})</div>;
                                            })}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })()}
            </div>

            {/* Footer instructions */}
            <div className="mt-3 text-sm text-gray-500 flex justify-between items-center">
                <div>
                    <span className="font-medium">Tip:</span> Scroll to navigate • Click nodes for details
                </div>
                <div className="text-xs">Graph updates automatically when tasks change</div>
            </div>
        </div>
    );
};

export default GraphVisualization;