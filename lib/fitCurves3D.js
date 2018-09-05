/*
	JavaScript implementation of
	CoffeeScript implementation of
	Python implementation of
	Algorithm for Automatically Fitting Digitized Curves
	by Philip J. Schneider
	"Graphics Gems", Academic Press, 1990

	CoffeeScript Source: https://github.com/soswow/fit-curves/blob/master/src/fitCurves.coffee
	JavaScript Implementation by Yay295
	V6 Changes:
	- Built from V5 of the main code.
	- Fixed some spelling and grammar inconsistencies.
	- Use dot product function in two places it was already being done.
*/

/*
	points - An array of points (ex. [[0,0,0],[1,5,4],[3,7,8]]) that reside on the
	curve to fit.

	maxError - How closely the returned Cubic Bezier Curve should fit to the
	given points. This should be a number greater than 0, with a lesser number
	giving a closer fit.

	return - An array of arrays of the four points required for a Cubic Bezier Curve.
*/
function fitCurve(points,maxError) {
	"use strict";

	// Remove duplicate points.
	points = points.filter((point,i) => (i === 0 || !(point[0] === points[i-1][0] && point[1] === points[i-1][1] && point[2] === points[i-1][2])));
	var len = points.length;
	if (len < 2) return [];

	// Simplified math.js functions used in this file.
	var add = (A,B) => [A[0]+B[0],A[1]+B[1],A[2]+B[2]];
	var subtract = (A,B) => [A[0]-B[0],A[1]-B[1],A[2]-B[2]];
	var multiply = (A,B) => [A[0]*B,A[1]*B,A[2]*B];
	var divide = (A,B) => [A[0]/B,A[1]/B,A[2]/B];
	var dot = (A,B) => A[0]*B[0]+A[1]*B[1]+A[2]*B[2];
	var sum = A => A[0]+A[1]+A[2];
	var norm = A => Math.sqrt((A[0]*A[0])+(A[1]*A[1])+(A[2]*A[2]));
	var normalize = v => divide(v,norm(v));


	// Functions to evaluate a cubic bezier at t. Returns a point.
	var bezier = {
		q: (ctrlPoly,t) => { // 0th Derivative
			let tx = 1 - t;
			return	add(
						add(
							multiply(ctrlPoly[0],     tx * tx * tx),
							multiply(ctrlPoly[1], 3 * tx * tx * t)
						),
						add(
							multiply(ctrlPoly[2], 3 * tx * t  * t),
							multiply(ctrlPoly[3],     t  * t  * t)
						)
					);
		},
		qprime: (ctrlPoly,t) => { // 1st Derivative
			let tx = 1 - t;
			return	add(
						add(
							multiply(subtract(ctrlPoly[1], ctrlPoly[0]), 3 * tx * tx),
							multiply(subtract(ctrlPoly[2], ctrlPoly[1]), 6 * tx * t)
						),
						multiply(subtract(ctrlPoly[3], ctrlPoly[2]), 3 * t * t)
					);
		},
		qprimeprime: (ctrlPoly,t) => { // 2nd Derivative
			return	add(
						multiply(add(subtract(ctrlPoly[2], multiply(ctrlPoly[1], 2)), ctrlPoly[0]), 6 * (1-t)),
						multiply(add(subtract(ctrlPoly[3], multiply(ctrlPoly[2], 2)), ctrlPoly[1]), 6 * t)
					);
		}
	};

	function fitCubic(points, leftTangent, rightTangent, error) {
		var len = points.length


		if (len < 2) return [];
		if (len === 2) {
			var dist = norm(subtract(points[0], points[1])) / 3;
			return [[points[0], add(points[0], multiply(leftTangent, dist)), add(points[1], multiply(rightTangent, dist)), points[1]]];
		}


		// Assign parameter values to digitized points using relative distances between points.
		var u = [0];
		for (let i = 1; i < len; ++i)
			u.push(u[i-1] + norm(subtract(points[i],points[i-1])));
		for (let i = 0; i < len; ++i)
			u[i] /= u[len-1];


		function generateBezier(points, parameters, leftTangent, rightTangent) {
			var len = points.length;
			var bezCurve = [points[0], points[0], points[len-1], points[len-1]];
			var A = [[0,0,0],[0,0,0]];
			var C = [0,0,0,0];
			var X = [0,0];

			for (let i = 0; i < len; ++i) {
				var u = parameters[i];
				var ux = 1 - u
				A[0] = multiply(leftTangent, 3 * ux * ux * u);
				A[1] = multiply(rightTangent, 3 * ux * u * u);

				C[0] += dot(A[0],A[0]);
				C[1] += dot(A[0],A[1]);
				C[2] += dot(A[0],A[1]);
				C[3] += dot(A[1],A[1]);

				var tmp = subtract(points[i],bezier.q(bezCurve,u));
				X[0] += dot(A[0],tmp);
				X[1] += dot(A[1],tmp);
			}

			var det_C0_C1 = (C[0] * C[3]) - (C[2] * C[1]);
			var det_C0_X  = (C[0] * X[1]) - (C[2] * X[0]);
			var det_X_C1  = (X[0] * C[3]) - (X[1] * C[1]);
			var alpha_l = det_C0_C1 === 0 ? 0 : det_X_C1 / det_C0_C1;
			var alpha_r = det_C0_C1 === 0 ? 0 : det_C0_X / det_C0_C1;
			var segLength = norm(subtract(points[0],points[len-1]));
			var epsilon = 1.0e-6 * segLength;

			if (alpha_l < epsilon || alpha_r < epsilon)
				alpha_l = alpha_r = segLength / 3;
			bezCurve[1] = add(bezCurve[0], multiply(leftTangent, alpha_l));
			bezCurve[2] = add(bezCurve[3], multiply(rightTangent, alpha_r));

			return bezCurve;
		}

		// Find the maximum squared distance of digitized points to fitted curve.
		function computeMaxError(points, bez, parameters) {
			var len = points.length;
			var bParts = 10, maxDist = 0, splitPoint = len / 2;

			// Sample 't's and map them to relative distances along the curve.
			var tDistMap = ((bez,bParts) => {
				var curr, prev = bez[0], dist = [0], sumLen = 0;
				for (var i = 1; i <= bParts; ++i) {
					curr = bezier.q(bez, i / bParts);
					sumLen += norm(subtract(curr,prev));
					dist.push(sumLen);
					prev = curr;
				}
				// Normalize B_length to the same interval as the parameter distances: 0 to 1.
				return dist.map(x => x / sumLen);
			})(bez,bParts);

			function find_t(param, tDistMap, bParts) {
				if (param <= 0) return 0;
				if (param >= 1) return 1;

				/*
					'param' is a value between 0 and 1 telling us the relative position of a point
					on the source polyline (linearly from the start (0) to the end (1)). To see if
					a given curve - 'bez' - is a close approximation of the polyline, we compare
					such a poly-point to the point on the curve that's the same relative distance
					along the curve's length. But finding that curve-point takes a little work.
					There is a function "B(t)" to find points along a curve from the parametric
					parameter 't' (also relative from 0 to 1:
						http://stackoverflow.com/a/32841764/1869660
						http://pomax.github.io/bezierinfo/#explanation ), but 't' isn't linear by
					length ( http://gamedev.stackexchange.com/questions/105230 ). So, we sample
					some points along the curve using a handful of values for 't'. Then, we
					calculate the length between those samples via plain Euclidean distance; B(t)
					concentrates the points around sharp turns, so this should give us a good-
					enough outline of the curve. Thus, for a given relative distance ('param'), we
					can now find an upper and lower value for the corresponding 't' by searching
					through those sampled distances. Finally, we can use linear interpolation to
					find a better value for the exact 't'. More info:
						http://gamedev.stackexchange.com/questions/105230/points-evenly-spaced-along-a-bezier-curve
						http://stackoverflow.com/questions/29438398/cheap-way-of-calculating-cubic-bezier-length
						http://steve.hollasch.net/cgindex/curves/cbezarclen.html
						https://github.com/retuxx/tinyspline
				*/

				// Find the two t's that the current param distance lies between,
				// and then interpolate a somewhat accurate value for the exact t.
				for (var i = 1; i <= bParts; ++i) {
					if (param <= tDistMap[i]) {
						var tMin   = (i - 1) / bParts;
						var tMax   = i / bParts;
						var lenMin = tDistMap[i-1];
						var lenMax = tDistMap[i];
						return (param - lenMin) / (lenMax - lenMin) * (tMax - tMin) + tMin;
					}
				}
			}

			for (let i = 0; i < len; ++i) {
				var v = subtract(bezier.q(bez,find_t(parameters[i],tDistMap,bParts)),points[i]);
				var dist = dot(v,v);
				if (dist > maxDist) {
					maxDist = dist;
					splitPoint = i;
				}
			}

			return [maxDist, splitPoint];
		}

		var bezCurve = generateBezier(points, u, leftTangent, rightTangent);
		var [maxError,splitPoint] = computeMaxError(points, bezCurve, u);

		if (maxError < error) return [bezCurve];


		function reparameterize(bezCurve, points, parameters) {
			function newtonRaphsonRootFind(bezCurve, point, u) {
				// Newton's root finding algorithm calculates f(x)=0 by reiterating x_n+1 = x_n - f(x_n)/f'(x_n)
				// We are trying to find curve parameter u for some point p that minimizes the
				// distance from that point to the curve. Distance point to curve is d=q(u)-p.
				// At minimum distance the point is perpendicular to the curve.
				// We are solving
				//   f = q(u)-p * q'(u) = 0
				// with
				//   f' = q'(u) * q'(u) + q(u)-p * q''(u)
				// giving
				//   u_n+1 = u_n - |q(u_n)-p * q'(u_n)| / |q'(u_n)**2 + q(u_n)-p * q''(u_n)|

				var d = subtract(bezier.q(bezCurve,u),point);
				var qprime = bezier.qprime(bezCurve,u);
				var numerator = dot(d,qprime);
				var denominator = dot(qprime,qprime) + 2 * dot(d,bezier.qprimeprime(bezCurve,u));

				return (denominator === 0 ? u : (u - numerator / denominator));
			}

			return points.map((point,i) => newtonRaphsonRootFind(bezCurve,point,parameters[i]));
		}

		if (maxError < error*error) {
			var uPrime = u, prevError = maxError, prevSplit = splitPoint;
			for (let i = 0; i < 20; ++i) {
				uPrime = reparameterize(bezCurve, points, uPrime);
				bezCurve = generateBezier(points, uPrime, leftTangent, rightTangent);
				[maxError,splitPoint] = computeMaxError(points, bezCurve, uPrime);

				if (maxError < error) return [bezCurve];

				if (splitPoint === prevSplit) {
					let errChange = maxError / prevError;
					if ((0.9999 < errChange) && (errChange < 1.0001)) break;
				}

				prevError = maxError;
				prevSplit = splitPoint;
			}
		}

		// To create a smooth transition from one curve segment to the next, we calculate the line
		// between the points directly before and after the center, and use that as the tangent
		// both to and from the center point. However, this won't work if they're the same point,
		// because the line we want to use as a tangent would be 0. Instead, we calculate the line
		// from that "double-point" to the center point, and use its tangent.
		var centerVector = subtract(points[splitPoint-1], points[splitPoint+1]);
		if ((centerVector[0] === 0) && (centerVector[1] === 0) && (centerVector[2] === 0)) {
			centerVector = subtract(points[splitPoint-1],points[splitPoint]);
			[centerVector[0],centerVector[1]] = [-centerVector[1],centerVector[0]];
		}

		var toCenterTangent = normalize(centerVector);
		var fromCenterTangent = multiply(toCenterTangent,-1);

		var beziers = [].concat(fitCubic(points.slice(0,splitPoint+1), leftTangent, toCenterTangent, error));
		return beziers.concat(fitCubic(points.slice(splitPoint), fromCenterTangent, rightTangent, error));
	}

	var leftTangent = normalize(subtract(points[1],points[0]));
	var rightTangent = normalize(subtract(points[len-2],points[len-1]));
	return fitCubic(points,leftTangent,rightTangent,maxError);
}
