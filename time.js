let points = [];

// Function to generate random points
function generateRandomPoints() {
  points = [];
  const numPoints = 20000000; // Number of random points
  const maxX = 800; // Max X coordinate
  const maxY = 600; // Max Y coordinate
  for (let i = 0; i < numPoints; i++) {
    const x = Math.floor(Math.random() * maxX) + 10; // Random X coordinate
    const y = Math.floor(Math.random() * maxY) + 10; // Random Y coordinate
    points.push({ x, y });
  }
}


function orientation(p, q, r) {
  const val = (q.y - p.y) * (r.x - q.x) - (q.x - p.x) * (r.y - q.y);
  if (val === 0) return 0;
  return val > 0 ? 1 : -1;
}

// Recursive function to find the convex hull using Kirkpatrick-Seidel algorithm
function findHull(points) {
  if (points.length <= 3) {
      return points;
  }

  const mid = Math.floor(points.length / 2);
  const leftPoints = points.slice(0, mid);
  const rightPoints = points.slice(mid);

  const leftHull = findHull(leftPoints);
  const rightHull = findHull(rightPoints);

  return mergeHulls(leftHull, rightHull);
}

// Function to find the upper tangent between two hulls
function getUpperTangent(leftHull, rightHull) {
  let leftIdx = leftHull.length - 1;
  let rightIdx = 0;
  let upperTangent = [null, null];

  while (true) {
      upperTangent[0] = leftHull[leftIdx];
      upperTangent[1] = rightHull[rightIdx];

      const leftNext = (leftIdx + 1) % leftHull.length;
      const rightNext = (rightIdx + 1) % rightHull.length;

      if (orientation(leftHull[leftIdx], rightHull[rightIdx], rightHull[rightNext]) < 0) {
          rightIdx = rightNext;
      } else if (orientation(rightHull[rightIdx], leftHull[leftIdx], leftHull[leftNext]) > 0) {
          leftIdx = leftNext;
      } else {
          break;
      }
  }

  return upperTangent;
}

// Function to find the lower tangent between two hulls
function getLowerTangent(leftHull, rightHull) {
  let leftIdx = 0;
  let rightIdx = rightHull.length - 1;
  let lowerTangent = [null, null];

  while (true) {
      lowerTangent[0] = leftHull[leftIdx];
      lowerTangent[1] = rightHull[rightIdx];

      const leftNext = (leftIdx + 1) % leftHull.length;
      const rightPrev = (rightIdx - 1 + rightHull.length) % rightHull.length;

      if (orientation(leftHull[leftIdx], rightHull[rightIdx], rightHull[rightPrev]) > 0) {
          rightIdx = rightPrev;
      } else if (orientation(rightHull[rightIdx], leftHull[leftIdx], leftHull[leftNext]) < 0) {
          leftIdx = leftNext;
      } else {
          break;
      }
  }

  return lowerTangent;
}

// Function to merge two convex hulls
// Function to merge two convex hulls
function mergeHulls(leftHull, rightHull) {
  const upperTangent = getUpperTangent(leftHull, rightHull);
  const lowerTangent = getLowerTangent(leftHull, rightHull);

  const mergedHull = [];

  // Add points from left hull to merged hull
  let currentPoint = upperTangent[0];
  let currentIndex = leftHull.indexOf(currentPoint);
  while (currentPoint !== lowerTangent[0]) {
      mergedHull.push(currentPoint);
      currentIndex = (currentIndex + 1) % leftHull.length;
      currentPoint = leftHull[currentIndex];
  }

  mergedHull.push(lowerTangent[0]);

  // Add points from right hull to merged hull
  currentPoint = lowerTangent[1];
  currentIndex = rightHull.indexOf(currentPoint);
  while (currentPoint !== upperTangent[1]) {
      mergedHull.push(currentPoint);
      currentIndex = (currentIndex + 1) % rightHull.length;
      currentPoint = rightHull[currentIndex];
  }

  mergedHull.push(upperTangent[1]);

  return mergedHull;
}

      // Function to compute convex hull (Kirkpatrick-Seidel algorithm)
      function computeConvexHullKirkpatrickSeidel() {
          if (points.length < 3) {
              alert('At least 3 points are required to compute the convex hull.');
              return;
          }
        //  console.log(points);
          convexHull = [];
          convexHullSteps = [];
          convexHullSteps.push([...points]); // Initial step with all points

          // Sort points by x-coordinate
          const sortedPoints = points.slice().sort((a, b) => a.x - b.x);

          // Find the convex hull using the Kirkpatrick-Seidel algorithm
          convexHull = findHull(sortedPoints);
          convexHullSteps.push({ hull: [...convexHull] });
      }
// Compute convex hull 10 times and log the time taken for each iteration
const times = [];
for (let i = 0; i < 10; i++) {
  generateRandomPoints();
  const start = process.hrtime.bigint();
  computeConvexHullKirkpatrickSeidel();
  const end = process.hrtime.bigint();
  const time = Number(end - start) / 1e6; // Convert to milliseconds
  console.log(`Iteration ${i + 1}: ${time} ms`);
  times.push(time);
}

// Calculate and log the average time
const totalTime = times.reduce((acc, curr) => acc + curr, 0);
const averageTime = totalTime / times.length;
console.log(`Average Convex Hull Computation Time: ${averageTime} ms`);