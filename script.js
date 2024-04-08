
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');

// Set canvas dimensions and pixel ratio
const dpr = window.devicePixelRatio || 1;
const canvasWidth = 1200;
const canvasHeight = 600;
canvas.width = canvasWidth * dpr;
canvas.height = canvasHeight * dpr;
ctx.scale(dpr, dpr);

// Array to hold points
let points = [];
let isManualPlacementMode = false;
let convexHullSteps = [];
let currentStep = 0;
let animationFrameId = null;
let convexHull = [];
let algorithm = 'jarvisMarch'; // Default algorithm is Jarvis March

function toggleManualPlacement() {
    const toggleButton = document.getElementById('myToggleButton');
    if (isManualPlacementMode) {
        toggleButton.classList.remove('active');
        canvas.removeEventListener('click', handleCanvasClick);
    } else {
        toggleButton.classList.add('active');
        canvas.addEventListener('click', handleCanvasClick);
    }
    isManualPlacementMode = !isManualPlacementMode;
}

// Function to generate random points within the canvas
// Function to generate random points within the canvas
function generateRandomPoints() {
    points = [];
    const numPoints = 10; // Number of random points
    const maxX = canvasWidth - 20; // Max X coordinate
    const maxY = canvasHeight - 20; // Max Y coordinate
    for (let i = 0; i < numPoints; i++) {
        const x = Math.floor(Math.random() * (maxX - 10)) + 10; // Random X coordinate within canvas
        const y = Math.floor(Math.random() * (maxY - 10)) + 10; // Random Y coordinate within canvas
        points.push({ x, y });
    }
    drawPoints();
    updateSlider();
    //computeConvexHull(); // Compute convex hull after generating points
}


// Function to clear canvas
function clearCanvas() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    points = [];
    convexHullSteps = [];
    convexHull = [];
    currentStep = 0;
    updateStepJarvisMarch(0);
    updateStepKirkpatrickSeidel(0);
    cancelAnimationFrame(animationFrameId);
    updateSlider();
}

// Function to handle mouse click on canvas
function handleCanvasClick(event) {
    if (isManualPlacementMode) {
        const rect = canvas.getBoundingClientRect();
        const x = (event.clientX - rect.left) * dpr; // Account for pixel ratio
        const y = (event.clientY - rect.top) * dpr; // Account for pixel ratio

        // Check if the point is inside the canvas
        if (x >= 0 && x < canvas.width && y >= 0 && y < canvas.height) {
            const canvasX = x / dpr; // Convert back to canvas coordinates
            const canvasY = y / dpr;

            // Check if the point is within the canvas boundaries
            if (canvasX >= 10 && canvasX <= canvasWidth - 10 && canvasY >= 10 && canvasY <= canvasHeight - 10) {
                points.push({ x: canvasX, y: canvasY });
                drawPoints();
                updateSlider();
            }
        }
    }
}
// Function to compute convex hull (Jarvis March algorithm)
function computeConvexHullJarvisMarch() {
    if (points.length < 3) {
        alert('At least 3 points are required to compute the convex hull.');
        return;
    }

    convexHull = [];
    let leftmost = points[0];
    for (let i = 1; i < points.length; i++) {
        if (points[i].x < leftmost.x) {
            leftmost = points[i];
        }
    }

    let current = leftmost;
    let next;
    convexHullSteps = [];
    convexHullSteps.push({ hull: [], lines: [], currentPoint: current }); // Initial step with current point

    do {
        convexHull.push(current);
        next = points[0];
        for (let i = 1; i < points.length; i++) {
            convexHullSteps.push({
                hull: [...convexHull],
                lines: [{ from: current, to: points[i] }], // Add individual line for each comparison
                currentPoint: current,
            });
            if (next === current || orientation(current, next, points[i]) === 1) {
                next = points[i];
            }
        }
        current = next;
    } while (current !== leftmost);

    convexHullSteps.push({ hull: [...convexHull], lines: [], currentPoint: null }); // Final step with convex hull and no lines

    animateConvexHull();
    updateStepJarvisMarch(0); // Reset step to 0
}

// Function to update step for Jarvis March algorithm
function updateStepJarvisMarch(stepValue) {
    currentStep = stepValue;
    const stepLabel = document.getElementById('stepLabel');
    stepLabel.textContent = `Step ${currentStep}`;
    const slider = document.getElementById('slider');
    slider.value = currentStep;

    const { hull, lines, currentPoint } = convexHullSteps[currentStep] || {};
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw points
    ctx.fillStyle = 'white';
    points.forEach(point => {
        ctx.beginPath();
        ctx.arc(point.x, point.y, 3 * dpr, 0, Math.PI * 2); // Account for pixel ratio
        ctx.fill();
    });

    // Draw lines for current step
    ctx.strokeStyle = 'gray';
    ctx.lineWidth = 1 * dpr; // Account for pixel ratio
    lines.forEach(line => {
        ctx.beginPath();
        ctx.moveTo(line.from.x, line.from.y);
        ctx.lineTo(line.to.x, line.to.y);
        ctx.stroke();
    });

    // Draw current hull
    ctx.beginPath();
    if (hull.length > 0) {
        ctx.moveTo(hull[0].x, hull[0].y);
        for (let i = 1; i < hull.length; i++) {
            ctx.lineTo(hull[i].x, hull[i].y);
        }
        ctx.strokeStyle = 'green';
        ctx.lineWidth = 2 * dpr; // Account for pixel ratio
        ctx.stroke();
    }

    // Draw current point
    if (currentPoint) {
        ctx.beginPath();
        ctx.arc(currentPoint.x, currentPoint.y, 5 * dpr, 0, Math.PI * 2); // Account for pixel ratio
        ctx.fillStyle = 'red';
        ctx.fill();
    }

    // Draw final joining line
    if (currentStep === convexHullSteps.length - 1 && hull.length > 1) {
        ctx.beginPath();
        ctx.moveTo(hull[hull.length - 1].x, hull[hull.length - 1].y);
        ctx.lineTo(hull[0].x, hull[0].y);
        ctx.strokeStyle = 'green';
        ctx.lineWidth = 2 * dpr; // Account for pixel ratio
        ctx.stroke();
    }
}

// Function to compute orientation
function orientation(p, q, r) {
    if (!r) return 0; // Return 0 if r is undefined
    const val = (q.y - p.y) * (r.x - q.x) - (q.x - p.x) * (r.y - q.y);
    if (val === 0) return 0;
    return val > 0 ? 1 : -1;
}

// Function to compute convex hull using Kirkpatrick-Seidel algorithm
function computeConvexHullKirkpatrickSeidel() {
    if (points.length < 3) {
        alert('At least 3 points are required to compute the convex hull.');
        return;
    }

    convexHullSteps = [];
    convexHull = kirkpatrickSeidel(points);

    animateConvexHull();
    updateStepKirkpatrickSeidel(0); // Reset step to 0
}

// Function to recursively find the convex hull using Kirkpatrick-Seidel algorithm
function kirkpatrickSeidel(points) {
    // Base case: If there are only 3 or fewer points, return them
    if (points.length <= 3) {
        convexHullSteps.push({ hull: points });
        return points;
    }

    // Sort points by x-coordinate
    points.sort((a, b) => a.x - b.x);

    // Find the median x-coordinate
    const medianIndex = Math.floor(points.length / 2);
    const medianX = points[medianIndex].x;

    // Find the intersection edges
    const intersectionEdges = findIntersectionEdges(points, medianX);

    // Discard non-contributing points
    const remainingPoints = discardNonContributingPoints(points, intersectionEdges);

    // Recursively find upper and lower hulls
    const upperHull = kirkpatrickSeidel(remainingPoints.upper);
    const lowerHull = kirkpatrickSeidel(remainingPoints.lower);

    // Merge upper and lower hulls
    return mergeConvexHulls(upperHull, lowerHull);
}

// Function to find intersection edges
function findIntersectionEdges(points, medianX) {
    const intersectionEdges = [];
    let left = null;
    let right = null;

    // Find the leftmost and rightmost points on the median line
    for (let i = 0; i < points.length; i++) {
        if (points[i].x === medianX) {
            if (!left) left = points[i];
            else right = points[i];
        }
    }

    // Find edges that intersect the median line
    for (let i = 0; i < points.length - 1; i++) {
        const p1 = points[i];
        const p2 = points[i + 1];
        if ((p1.x < medianX && p2.x > medianX) || (p1.x > medianX && p2.x < medianX)) {
            intersectionEdges.push({ from: p1, to: p2 });
        }
    }

    // Add the bridge edge
    if (left && right) {
        intersectionEdges.push({ from: left, to: right });
    }

    return intersectionEdges;
}

// Function to discard non-contributing points
function discardNonContributingPoints(points, intersectionEdges) {
    const upperPoints = [];
    const lowerPoints = [];
    let bridgeEdge = null;

    for (let i = 0; i < points.length; i++) {
        let isContributing = true;
        for (let j = 0; j < intersectionEdges.length; j++) {
            const edge = intersectionEdges[j];
            const orientationP1 = orientation(edge.from, edge.to, points[i]);
            if (orientationP1 === -1) {
                isContributing = false;
                break;
            } else if (orientationP1 === 0) {
                // Points collinear with the edge should be included only if they are on the bridge edge
                const minX = Math.min(edge.from.x, edge.to.x);
                const maxX = Math.max(edge.from.x, edge.to.x);
                if (points[i].x >= minX && points[i].x <= maxX) {
                    bridgeEdge = edge;
                    isContributing = true;
                }
            }
        }
        if (isContributing) {
            if (points[i].y < bridgeEdge.from.y) {
                lowerPoints.push(points[i]);
            } else if (points[i].y > bridgeEdge.from.y) {
                upperPoints.push(points[i]);
            }
        }
    }

    return { upper: upperPoints, lower: lowerPoints };
}

// Function to merge the convex hulls of upper and lower sets
function mergeConvexHulls(upperHull, lowerHull) {
    // Remove duplicate points from upperHull and lowerHull
    upperHull = upperHull.filter((point, index, self) => self.findIndex(p => p.x === point.x && p.y === point.y) === index);
    lowerHull = lowerHull.filter((point, index, self) => self.findIndex(p => p.x === point.x && p.y === point.y) === index);

    // Merge the upper and lower hulls
    const mergedHull = [...upperHull, ...lowerHull];

    // Sort merged hull by x-coordinate
    mergedHull.sort((a, b) => a.x - b.x || a.y - b.y);

    convexHullSteps.push({ hull: mergedHull });
    return mergedHull;
}

// Function to update step for Kirkpatrick-Seidel algorithm
function updateStepKirkpatrickSeidel(stepValue) {
    currentStep = stepValue;
    const stepLabel = document.getElementById('stepLabel');
    stepLabel.textContent = `Step ${currentStep}`;
    const slider = document.getElementById('slider');
    slider.value = currentStep;

    const { hull } = convexHullSteps[currentStep] || {};
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw points
    ctx.fillStyle = 'white';
    points.forEach(point => {
        ctx.beginPath();
        ctx.arc(point.x, point.y, 3 * dpr, 0, Math.PI * 2); // Account for pixel ratio
        ctx.fill();
    });

    // Draw current hull
    if (hull) {
        drawConvexHull(hull);
    }

    if (currentStep === convexHullSteps.length - 1) {
        drawConvexHull(convexHull);
    }
}

// Function to draw convex hull
function drawConvexHull(hull) {
    ctx.beginPath();
    ctx.moveTo(hull[0].x, hull[0].y);
    for (let i = 1; i < hull.length; i++) {
        ctx.lineTo(hull[i].x, hull[i].y);
    }
    ctx.closePath();
    ctx.strokeStyle = 'green';
    ctx.lineWidth = 2 * dpr; // Account for pixel ratio
    ctx.stroke();
}







function animateConvexHull() {
    let stepCounter = 0;

    function animate() {
        if (algorithm === 'jarvisMarch') {
            updateStepJarvisMarch(stepCounter);
        } else if (algorithm === 'kirkpatrickSeidel') {
            updateStepKirkpatrickSeidel(stepCounter);
        }
        stepCounter++;

        if (stepCounter < convexHullSteps.length) {
            animationFrameId = requestAnimationFrame(animate);
        } else {
            cancelAnimationFrame(animationFrameId);
        }
    }

    animate();
}

// Function to draw points
function drawPoints() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = 'white';
    points.forEach(point => {
        ctx.beginPath();
        ctx.arc(point.x, point.y, 3 * dpr, 0, Math.PI * 2); // Account for pixel ratio
        ctx.fill();
    });
}



// Function to update slider
function updateSlider() {
    const slider = document.getElementById('slider');
    slider.max = convexHullSteps.length - 1;
    slider.value = currentStep;
}

// Add event listener for slider
const slider = document.getElementById('slider');
slider.addEventListener('input', () => {
    if (algorithm === 'jarvisMarch') {
        updateStepJarvisMarch(parseInt(slider.value));
    } else if (algorithm === 'kirkpatrickSeidel') {
        updateStepKirkpatrickSeidel(parseInt(slider.value));
    }
});

// Add event listener for algorithm selection
const algorithmSelect = document.getElementById('algorithmSelect');
algorithmSelect.addEventListener('change', () => {
    algorithm = algorithmSelect.value;
});

// Function to compute convex hull
function computeConvexHull() {
    if (algorithm === 'jarvisMarch') {
        computeConvexHullJarvisMarch();
    } else if (algorithm === 'kirkpatrickSeidel') {
        computeConvexHullKirkpatrickSeidel();
    }
}


