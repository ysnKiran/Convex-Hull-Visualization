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

// // Function to compute orientation
// function orientation(p, q, r) {
//     if (!r) return 0; // Return 0 if r is undefined
//     const val = (q.y - p.y) * (r.x - q.x) - (q.x - p.x) * (r.y - q.y);
//     if (val === 0) return 0;
//     return val > 0 ? 1 : -1;
// }

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


function findIntersectionEdges(points, medianX) {
    const intersectionEdges = [];
    let bridgeEdge = null;
    let left = null;
    let right = null;

    for (let i = 0; i < points.length; i++) {
        if (points[i].x === medianX) {
            if (!left) left = points[i];
            else right = points[i];
        }
    }

    for (let i = 0; i < points.length - 1; i++) {
        const p1 = points[i];
        const p2 = points[i + 1];
        if ((p1.x < medianX && p2.x > medianX) || (p1.x > medianX && p2.x < medianX)) {
            intersectionEdges.push({ from: p1, to: p2 });
        }
    }

    if (left && right) {
        bridgeEdge = { from: left, to: right };
    }

    return { intersectionEdges, bridgeEdge };
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
                const minX = Math.min(edge.from.x, edge.to.x);
                const maxX = Math.max(edge.from.x, edge.to.x);
                if (points[i].x >= minX && points[i].x <= maxX) {
                    bridgeEdge = edge;
                    isContributing = true;
                }
            }
        }
        if (isContributing) {
            if (bridgeEdge) {
                if (points[i].y < bridgeEdge.from.y) {
                    lowerPoints.push(points[i]);
                } else if (points[i].y > bridgeEdge.from.y) {
                    upperPoints.push(points[i]);
                }
            } else {
                upperPoints.push(points[i]);
                lowerPoints.push(points[i]);
            }
        }
    }

    return { upper: upperPoints, lower: lowerPoints };
}
// function mergeConvexHulls(upperHull, lowerHull) {
//     const mergedHull = [];

//     // Find the rightmost point of the upper hull
//     let rightmostUpperIndex = 0;
//     for (let i = 1; i < upperHull.length; i++) {
//         if (upperHull[i].x > upperHull[rightmostUpperIndex].x) {
//             rightmostUpperIndex = i;
//         }
//     }

//     // Find the leftmost point of the lower hull
//     let leftmostLowerIndex = 0;
//     for (let i = 1; i < lowerHull.length; i++) {
//         if (lowerHull[i].x < lowerHull[leftmostLowerIndex].x) {
//             leftmostLowerIndex = i;
//         }
//     }

//     // Merge the hulls starting from the rightmost point of the upper hull
//     let currentPoint = upperHull[rightmostUpperIndex];
//     let currentUpperIndex = rightmostUpperIndex;
//     let currentLowerIndex = leftmostLowerIndex;

//     // Add the points from the upper hull
//     do {
//         mergedHull.push(currentPoint);
//         currentUpperIndex = (currentUpperIndex + 1) % upperHull.length;
//         currentPoint = upperHull[currentUpperIndex];
//     } while (currentUpperIndex !== rightmostUpperIndex);

//     // Add the points from the lower hull
//     do {
//         mergedHull.push(currentPoint);
//         currentLowerIndex = (currentLowerIndex + 1) % lowerHull.length;
//         currentPoint = lowerHull[currentLowerIndex];
//     } while (currentLowerIndex !== leftmostLowerIndex);

//     // Add the leftmost point of the lower hull to close the hull
//     mergedHull.push(lowerHull[leftmostLowerIndex]);

//     return mergedHull;
// }
function mergeConvexHulls(upperHull, lowerHull) {
    const mergedHull = [];

    // Add points from the upper hull
    for (let i = 0; i < upperHull.length; i++) {
        mergedHull.push(upperHull[i]);
    }

    // Add points from the lower hull (excluding the first and last points)
    for (let i = 1; i < lowerHull.length - 1; i++) {
        mergedHull.push(lowerHull[i]);
    }

    return mergedHull;
}

function orientation(p, q, r) {
    const val = (q.y - p.y) * (r.x - q.x) - (q.x - p.x) * (r.y - q.y);
    if (val === 0) return 0; // Collinear
    return val > 0 ? 1 : -1; // Clockwise or counterclockwise
}

function findUpperBridge(leftPoints, rightPoints) {
    let leftBridge = leftPoints[leftPoints.length - 1];
    let rightBridge = rightPoints[0];

    for (let i = leftPoints.length - 2; i >= 0; i--) {
        const leftPoint = leftPoints[i];
        if (orientation(leftPoint, rightBridge, leftBridge) === 1) {
            leftBridge = leftPoint;
        }
    }

    for (let i = 1; i < rightPoints.length; i++) {
        const rightPoint = rightPoints[i];
        if (orientation(leftBridge, rightPoint, rightBridge) === -1) {
            rightBridge = rightPoint;
        }
    }

    return [leftBridge, rightBridge];
}

function findUpperHull(points) {
    if (points.length <= 1) {
        return points;
    }

    points.sort((a, b) => a.x === b.x ? a.y - b.y : a.x - b.x);

    const upperHull = [];
    for (let i = 0; i < points.length; i++) {
        while (upperHull.length >= 2 && orientation(upperHull[upperHull.length - 2], upperHull[upperHull.length - 1], points[i]) !== -1) {
            upperHull.pop();
        }
        upperHull.push(points[i]);
    }

    return upperHull;
}

function findLowerHull(points) {
    if (points.length <= 1) {
        return points;
    }

    points.sort((a, b) => a.x === b.x ? a.y - b.y : a.x - b.x);

    const lowerHull = [];
    for (let i = points.length - 1; i >= 0; i--) {
        while (lowerHull.length >= 2 && orientation(lowerHull[lowerHull.length - 2], lowerHull[lowerHull.length - 1], points[i]) !== -1) {
            lowerHull.pop();
        }
        lowerHull.push(points[i]);
    }

    return lowerHull;
}

function findLowerBridge(leftPoints, rightPoints) {
    let leftBridge = leftPoints[leftPoints.length - 1];
    let rightBridge = rightPoints[0];

    for (let i = leftPoints.length - 2; i >= 0; i--) {
        const leftPoint = leftPoints[i];
        if (orientation(leftPoint, rightBridge, leftBridge) === -1) {
            leftBridge = leftPoint;
        }
    }

    for (let i = 1; i < rightPoints.length; i++) {
        const rightPoint = rightPoints[i];
        if (orientation(leftBridge, rightPoint, rightBridge) === 1) {
            rightBridge = rightPoint;
        }
    }

    return [leftBridge, rightBridge];
}

function kirkpatrickSeidel(points) {
    if (points.length <= 3) {
        convexHullSteps.push({ hull: points });
        return points;
    }

    points.sort((a, b) => a.x - b.x);

    const medianIndex = Math.floor(points.length / 2);
    const medianX = points[medianIndex].x;
    convexHullSteps.push({ medianLine: { x: medianX }, points: [...points] });

    const { intersectionEdges, bridgeEdge } = findIntersectionEdges(points, medianX);
    convexHullSteps.push({ intersectionEdges: intersectionEdges, bridgeEdge: bridgeEdge, points: [...points] });

    const slopes = [];
    for (let i = 0; i < points.length; i++) {
        for (let j = i + 1; j < points.length; j++) {
            const slope = (points[j].y - points[i].y) / (points[j].x - points[i].x);
            slopes.push(slope);
        }
    }
    slopes.sort((a, b) => a - b);
    const medianSlope = slopes[Math.floor(slopes.length / 2)];
    convexHullSteps.push({ idealSlope: medianSlope, points: [...points] });

    const sweepLine = { slope: medianSlope, x: medianX };
    convexHullSteps.push({ sweepLine: sweepLine, points: [...points] });

    const remainingPoints = discardNonContributingPoints(points, intersectionEdges);
    convexHullSteps.push({
        upperSubset: remainingPoints.upper,
        lowerSubset: remainingPoints.lower,
        discardedPoints: points.filter(p => !remainingPoints.upper.includes(p) && !remainingPoints.lower.includes(p)),
        points: [...points]
    });

    const upperHull = findUpperHull(remainingPoints.upper);
    convexHullSteps.push({ upperHull: upperHull, upperSubset: remainingPoints.upper, points: [...points] });
    const lowerHull = findLowerHull(remainingPoints.lower);
    convexHullSteps.push({ lowerHull: lowerHull, lowerSubset: remainingPoints.lower, points: [...points] });

    const mergedHull = mergeConvexHulls(upperHull, lowerHull);
    convexHullSteps.push({ mergedHull: mergedHull, points: [...points] });

    return mergedHull;
}

function updateStepKirkpatrickSeidel(stepValue) {
    currentStep = stepValue;
    const stepLabel = document.getElementById('stepLabel');
    stepLabel.textContent = `Step ${currentStep}`;
    const slider = document.getElementById('slider');
    slider.value = currentStep;

    const {
        hull,
        intersectionEdges,
        bridgeEdge,
        upperSubset,
        lowerSubset,
        discardedPoints,
        medianLine,
        idealSlope,
        sweepLine,
        upperHull,
        lowerHull,
        mergedHull,
        points
    } = convexHullSteps[currentStep] || {};
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = 'white';
    points.forEach(point => {
        ctx.beginPath();
        ctx.arc(point.x, point.y, 3 * dpr, 0, Math.PI * 2);
        ctx.fill();
    });

    if (medianLine) {
        ctx.strokeStyle = 'purple';
        ctx.lineWidth = 1 * dpr;
        ctx.beginPath();
        ctx.moveTo(medianLine.x, 0);
        ctx.lineTo(medianLine.x, canvas.height);
        ctx.stroke();

        const leftSubset = points.filter(point => point.x < medianLine.x);
        const rightSubset = points.filter(point => point.x > medianLine.x);

        ctx.fillStyle = 'blue';
        leftSubset.forEach(point => {
            ctx.beginPath();
            ctx.arc(point.x, point.y, 3 * dpr, 0, Math.PI * 2);
            ctx.fill();
        });

        ctx.fillStyle = 'green';
        rightSubset.forEach(point => {
            ctx.beginPath();
            ctx.arc(point.x, point.y, 3 * dpr, 0, Math.PI * 2);
            ctx.fill();
        });
    }

    if (idealSlope) {
        ctx.strokeStyle = 'green';
        ctx.lineWidth = 1 * dpr;
        ctx.beginPath();
        ctx.moveTo(0, canvas.height);
        ctx.lineTo(canvas.width, canvas.height - idealSlope * canvas.width);
        ctx.stroke();
    }

    if (sweepLine) {
        ctx.strokeStyle = 'purple';
        ctx.lineWidth = 1 * dpr;
        ctx.beginPath();
        ctx.moveTo(sweepLine.x, 0);
        ctx.lineTo(sweepLine.x + canvas.width, sweepLine.slope * canvas.width);
        ctx.stroke();
    }

    if (intersectionEdges) {
        ctx.strokeStyle = 'orange';
        ctx.lineWidth = 1 * dpr;
        intersectionEdges.forEach(edge => {
            ctx.beginPath();
            ctx.moveTo(edge.from.x, edge.from.y);
            ctx.lineTo(edge.to.x, edge.to.y);
            ctx.stroke();
        });
    }

    if (bridgeEdge) {
        ctx.strokeStyle = 'red';
        ctx.lineWidth = 2 * dpr;
        ctx.beginPath();
        ctx.moveTo(bridgeEdge.from.x, bridgeEdge.from.y);
        ctx.lineTo(bridgeEdge.to.x, bridgeEdge.to.y);
        ctx.stroke();
    }

    if (upperHull) {
        drawConvexHull(upperHull, 'blue');
    }

    if (lowerHull) {
        drawConvexHull(lowerHull, 'green');
    }

    if (currentStep === convexHullSteps.length - 1) {
        drawConvexHull(convexHull, 'purple', 4); // Increase line width for the final convex hull
    }

    if (upperHull && upperSubset) {
        drawConvexHull(upperHull, 'blue');
        ctx.fillStyle = 'rgba(0, 0, 255, 0.2)';
        ctx.beginPath();
        upperHull.forEach(point => {
            ctx.lineTo(point.x, point.y);
        });
        ctx.closePath();
        ctx.fill();
    }
    if (lowerHull && lowerSubset) {
        drawConvexHull(lowerHull, 'green');
        ctx.fillStyle = 'rgba(0, 255, 0, 0.2)';
        ctx.beginPath();
        ctx.moveTo(lowerHull[0].x, lowerHull[0].y);
        lowerHull.forEach(point => {
            ctx.lineTo(point.x, point.y);
        });
        ctx.closePath();
        ctx.fill();
    }
    
    



    if (discardedPoints) {
        ctx.fillStyle = 'gray';
        discardedPoints.forEach(point => {
            ctx.beginPath();
            ctx.arc(point.x, point.y, 3 * dpr, 0, Math.PI * 2);
            ctx.fill();
        });
    }

  

    if (currentStep === convexHullSteps.length - 1) {
        drawConvexHull(convexHull, 'purple');
    }

    const explanation = document.getElementById('explanation');
    explanation.innerHTML = getStepExplanation(currentStep);
}
        
function getStepExplanation(step) {
    const explanations = [
        
        'The points are divided into left and right subsets using the median x-value.',
        'Intersection edges are found between the points and the median line.',
        'The bridge edge connecting the left and right subsets is determined.',
        'Non-contributing points are discarded to speed up the search for the bridge edge.',
        'The upper and lower subsets are identified based on the bridge edge.',
        'The upper hull is recursively computed for the upper subset.',
        'The lower hull is recursively computed for the lower subset.',
        'The upper and lower hulls are merged to form the final convex hull.'
    ];
    return explanations[step] || '';
}

function drawConvexHull(hull, color, lineWidth = 2) {
    ctx.strokeStyle = color;
    ctx.lineWidth = lineWidth * dpr;
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