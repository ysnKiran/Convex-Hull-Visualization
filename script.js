
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

// function toggleManualPlacement() {
//     const toggleButton = document.getElementById('myToggleButton');
//     if (isManualPlacementMode) {
//         toggleButton.classList.remove('active');
//         canvas.removeEventListener('click', handleCanvasClick);
//     } else {
//         toggleButton.classList.add('active');
//         canvas.addEventListener('click', handleCanvasClick);
//     }
//     isManualPlacementMode = !isManualPlacementMode;
// }

function updatePointCount(value) {
    // Map the slider value to the number of points
    const numPoints = [5, 10, 15][value];

    // Update the global numPoints variable
    window.numPoints = numPoints;

    // Update the label
    document.getElementById('pointLabel').textContent = `Points: ${numPoints}`;

    // Generate new random points
    generateRandomPoints();
}

// Store the last generated points
let lastPoints = [];
// Function to generate random points within the canvas
function generateRandomPoints() {
    let pointSet = [];
    let randomIndex;

    // Retrieve numPoints from the slider's value
    let numPoints = [5, 10, 15][document.getElementById('pointSlider').value];

    // Keep selecting a random set of points until its length matches numPoints
    do {
        randomIndex = Math.floor(Math.random() * window.points.length);
        pointSet = window.points[randomIndex];
    } while (pointSet.length !== numPoints || JSON.stringify(pointSet) === JSON.stringify(lastPoints));

    // Assign the selected set of points to the global points array
    points = pointSet;

    // Store the current points as the last generated points
    lastPoints = pointSet.slice();

    drawPoints();
    updateSlider();
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

// // Function to handle mouse click on canvas
// function handleCanvasClick(event) {
//     if (isManualPlacementMode) {
//         const rect = canvas.getBoundingClientRect();
//         const x = (event.clientX - rect.left) * dpr; // Account for pixel ratio
//         const y = (event.clientY - rect.top) * dpr; // Account for pixel ratio

//         // Check if the point is inside the canvas
//         if (x >= 0 && x < canvas.width && y >= 0 && y < canvas.height) {
//             const canvasX = x / dpr; // Convert back to canvas coordinates
//             const canvasY = y / dpr;

//             // Check if the point is within the canvas boundaries
//             if (canvasX >= 10 && canvasX <= canvasWidth - 10 && canvasY >= 10 && canvasY <= canvasHeight - 10) {
//                 points.push({ x: canvasX, y: canvasY });
//                 drawPoints();
//                 updateSlider();
//             }
//         }
//     }
// }


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

function orientation(p, q, r) {
    const val = (q.y - p.y) * (r.x - q.x) - (q.x - p.x) * (r.y - q.y);
    if (val === 0) return 0; // Collinear
    return val > 0 ? 1 : -1; // Clockwise or counterclockwise
}

function recursiveHull(points) {
    if (points.length <= 3) {
        return points;
    }

    const median = findMedianOfMedians(points);
    const leftPoints = points.filter(p => p.x < median.x);
    const rightPoints = points.filter(p => p.x > median.x);

    const leftHull = recursiveHull(leftPoints);
    const rightHull = recursiveHull(rightPoints);

    return mergedHull(leftHull, rightHull, median);
}

function getUpperBridge(leftHull, rightHull, median) {
    let leftIdx = leftHull.length - 1;
    let rightIdx = 0;
    let upperBridge = [null, null];

    while (true) {
        upperBridge[0] = leftHull[leftIdx];
        upperBridge[1] = rightHull[rightIdx];

        convexHullSteps.push({
            hull: [...convexHull],
            lines: [
                { from: { x: median.x, y: 0 }, to: { x: median.x, y: canvas.height } }, // Median line
                { from: upperBridge[0], to: upperBridge[1] }, // Upper bridge
            ],
            currentPoint: null,
        });

        const leftNext = (leftIdx + 1) % leftHull.length;
        const rightNext = (rightIdx + 1) % rightHull.length;

        if (orientation(leftHull[leftIdx], median, rightHull[rightNext]) < 0) {
            rightIdx = rightNext;
        } else if (orientation(median, leftHull[leftIdx], leftHull[leftNext]) > 0) {
            leftIdx = leftNext;
        } else {
            break;
        }
    }

    return upperBridge;
}

function getLowerBridge(leftHull, rightHull, median) {
    let leftIdx = 0;
    let rightIdx = rightHull.length - 1;
    let lowerBridge = [null, null];

    while (true) {
        lowerBridge[0] = leftHull[leftIdx];
        lowerBridge[1] = rightHull[rightIdx];

        convexHullSteps.push({
            hull: [...convexHull],
            lines: [
                { from: { x: median.x, y: 0 }, to: { x: median.x, y: canvas.height } }, // Median line
                { from: lowerBridge[0], to: lowerBridge[1] }, // Lower bridge
            ],
            currentPoint: null,
        });

        const leftNext = (leftIdx + 1) % leftHull.length;
        const rightPrev = (rightIdx - 1 + rightHull.length) % rightHull.length;

        if (orientation(leftHull[leftIdx], median, rightHull[rightPrev]) > 0) {
            rightIdx = rightPrev;
        } else if (orientation(median, leftHull[leftIdx], leftHull[leftNext]) < 0) {
            leftIdx = leftNext;
        } else {
            break;
        }
    }

    return lowerBridge;
}

function mergedHull(leftHull, rightHull, median) {
    const upperBridge = getUpperBridge(leftHull, rightHull, median);
    const lowerBridge = getLowerBridge(leftHull, rightHull, median);

    const mergedHull = [];

    // Add points from left hull to merged hull
    let currentPoint = upperBridge[0];
    let currentIndex = leftHull.indexOf(currentPoint);
    while (currentPoint !== lowerBridge[0]) {
        mergedHull.push(currentPoint);
        currentIndex = (currentIndex + 1) % leftHull.length;
        currentPoint = leftHull[currentIndex];
    }

    mergedHull.push(lowerBridge[0]);

    // Add points from right hull to merged hull
    currentPoint = lowerBridge[1];
    currentIndex = rightHull.indexOf(currentPoint);
    while (currentPoint !== upperBridge[1]) {
        mergedHull.push(currentPoint);
        currentIndex = (currentIndex + 1) % rightHull.length;
        currentPoint = rightHull[currentIndex];
    }

    mergedHull.push(upperBridge[1]);

    return mergedHull;
}

function findMedianOfMedian(points) {
    const n = points.length;
    const groups = [];

    // Divide the points into groups of 5
    for (let i = 0; i < n; i += 5) {
        const group = points.slice(i, i + 5);
        groups.push(group);
    }

    // Find the median of each group
    const medians = groups.map(group => {
        group.sort((a, b) => a.x - b.x);
        return group[Math.floor(group.length / 2)];
    });

    // Recursively find the median of the medians
    if (medians.length <= 5) {
        medians.sort((a, b) => a.x - b.x);
        return medians[Math.floor(medians.length / 2)];
    } else {
        return findMedianOfMedian(medians);
    }
}

function computeConvexHullKirkpatrickSeidel() {
    if (points.length < 3) {
        alert('At least 3 points are required to compute the convex hull.');
        return;
    }
    console.log(points);
    convexHull = [];
    convexHullSteps = [];
    convexHullSteps.push([...points]); // Initial step with all points

    // Sort points by x-coordinate
    const sortedPoints = points.slice().sort((a, b) => a.x - b.x);

    // Find the convex hull using the Kirkpatrick-Seidel algorithm
    convexHull = recursiveHull(sortedPoints);
    convexHullSteps.push({ hull: [...convexHull] });

    animateConvexHull();
    updateStepKirkpatrickSeidel(0); // Reset step to 0
}

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
    ctx.beginPath();
    if (hull) {
        ctx.moveTo(hull[0].x, hull[0].y);
        for (let i = 1; i < hull.length; i++) {
            ctx.lineTo(hull[i].x, hull[i].y);
        }
        ctx.closePath();
        ctx.strokeStyle = 'green';
        ctx.lineWidth = 2 * dpr; // Account for pixel ratio
        ctx.stroke();
    }

    if (currentStep === convexHullSteps.length - 1) {
        drawConvexHull(convexHull);
    }
}

function drawConvexHull(hull, color) {
    ctx.strokeStyle = color;
    ctx.lineWidth = 2 * dpr;
    ctx.beginPath();
    ctx.moveTo(hull[0].x, hull[0].y);
    for (let i = 1; i < hull.length; i++) {
        ctx.lineTo(hull[i].x, hull[i].y);
    }
    ctx.closePath();
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
async function drawPoints() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = 'white';
    for (let i = 0; i < points.length; i++) {
        await new Promise(resolve => setTimeout(resolve, 100)); // Delay of 0.5 sec
        ctx.beginPath();
        ctx.arc(points[i].x, points[i].y, 3 * dpr, 0, Math.PI * 2); // Account for pixel ratio
        ctx.fill();
    }
}

// Function to update slider
function updateSlider() {
    const slider = document.getElementById('slider');
    slider.max = convexHullSteps.length - 1;
    slider.value = currentStep;
}

function findMedianOfMedians(points) {
    return Math.floor(points.length / 2);
}

// Add event listener for slider
const slider = document.getElementById('slider');
slider.addEventListener('input', () => {
    const stepValue = parseInt(slider.value);
    if (algorithm === 'jarvisMarch') {
        updateStepJarvisMarch(stepValue);
    } else if (algorithm === 'kirkpatrickSeidel') {
        updateStepKirkpatrickSeidel(stepValue);
    }
});

// Add event listener for algorithm selection
const algorithmSelect = document.getElementById('algorithmSelect');
algorithmSelect.addEventListener('change', () => {
    algorithm = algorithmSelect.value;
    computeConvexHull();
});

// Function to compute convex hull
function computeConvexHull() {
    if (algorithm === 'jarvisMarch') {
        computeConvexHullJarvisMarch();
    } else if (algorithm === 'kirkpatrickSeidel') {
        computeConvexHullKirkpatrickSeidel();
    }
}