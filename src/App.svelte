<script lang="ts">
	import type { Point, Context, RectangleStrategy, Rectangle } from "./helpers";
	import { range, slope, twoPointForm, visitStrategy, sumBy} from "./helpers";
	import * as katex from "katex";
	import { onMount } from 'svelte/internal';
	import { tooltip } from './tooltip';

	// ********************* graph *********************
	const DEFAULT_BOUND_MAGNITUDE = Math.ceil(Math.PI);
	const GRAPH_AXIS_MARK_LENGTH = 0.08;

	const xMaxBound = DEFAULT_BOUND_MAGNITUDE
	const xMinBound = -DEFAULT_BOUND_MAGNITUDE

	const yMaxBound = DEFAULT_BOUND_MAGNITUDE
	const yMinBound = -DEFAULT_BOUND_MAGNITUDE

	// ********************* function *********************

	let f: (x: number) => number
	$: f = functions[selectedFunctionIndex].implementation

	let numberOfPoints: number = 100;

	let points: Point[]
	$: points = [...range(numberOfPoints).map(n => {
		const x = xMinBound + (n * ((xMaxBound - xMinBound) / numberOfPoints))
		return {x: x, y: f(x)}
	}), {x: xMaxBound, y: f(xMaxBound)}];

	// ********************* derivatives *********************
	const DELTA_X_APPROACHES_0 = 0.00001;

	let deltaX = 1
	
	let secantPoint1: Point
	$: secantPoint1 = {x: x, y: f(x)}

	let secantPoint2: Point
	$: secantPoint2 = (deltaX !== 0) ? {x: x + deltaX, y: f(x + deltaX)} : tangentPoint2

	// let secantSlopeTextDisplayPoint: Point
	// $: secantSlopeTextDisplayPoint = {x: x + deltaX + 0.5, y: f(x + deltaX) + 0.5}

	let secant: (x: number) => number
	$: secant = twoPointForm(secantPoint1, secantPoint2)

	let displayedSecantLine: {x1: number, y1: number, x2: number, y2: number}
	$: displayedSecantLine = {
		x1: xMinBound, y1: secant(xMinBound),
		x2: xMaxBound, y2: secant(xMaxBound)
	}

	let tangentPoint1: Point
	$: tangentPoint1 = {x: x, y: f(x)}

	let tangentPoint2: Point
	$: tangentPoint2 = {x: x + DELTA_X_APPROACHES_0, y: f(x + DELTA_X_APPROACHES_0)}

	let tangent: (x: number) => number
	$: tangent = twoPointForm(tangentPoint1, tangentPoint2)

	let slopeTangent: number
	$: slopeTangent = slope(tangentPoint1, tangentPoint2)
	
	let slopeSecant: number
	$: slopeSecant = (deltaX !== 0) ? slope(secantPoint1, secantPoint2) : slopeTangent

	let displayedTangentLine: {x1: number, y1: number, x2: number, y2: number}
	$: displayedTangentLine = {
		x1: xMinBound, y1: tangent(xMinBound),
		x2: xMaxBound, y2: tangent(xMaxBound)
	}

	// ********************* integrals *********************

	let rectangleStrategy: RectangleStrategy
	$: rectangleStrategy = 'Left'

	let sliderRectangleWidth = 2;
	let rectangleWidth: number;
	$: rectangleWidth = sliderRectangleWidth//Math.exp(sliderRectangleWidth) - 1;

	let integralBound1 = -DEFAULT_BOUND_MAGNITUDE
	let integralBound2 = DEFAULT_BOUND_MAGNITUDE
	
	let integralLowerBound: number;
	$: integralLowerBound = Math.min(integralBound1, integralBound2);

	let integralUpperBound: number;
	$: integralUpperBound = Math.max(integralBound1, integralBound2);

	let numberRectangles: number;
	$: numberRectangles = (integralUpperBound - integralLowerBound) / rectangleWidth;

	let riemannRectangles: Rectangle[]
	$: riemannRectangles = range(numberRectangles).map(n => {
		const x = integralLowerBound + (n * (integralUpperBound - integralLowerBound) / numberRectangles);

		const y = f(x + visitStrategy(rectangleStrategy, {
			whenLeft: 0,
			whenMidpoint: (rectangleWidth / 2),
			whenRight: rectangleWidth
		}))

		// SVG can't process negative height 
		return {
			height: Math.abs(y),
			width: rectangleWidth,
			lowerLeftCorner: {x: x, y: (y > 0) ? 0 : y}
		};
	});
	
	let actualSum: number
	$: actualSum = (() => {
		let sum = 0
	
		for(let n = 0; n < ((integralUpperBound - integralLowerBound) / DELTA_X_APPROACHES_0); n++) {
			const x = integralLowerBound + (n * (integralUpperBound - integralLowerBound) / ((integralUpperBound - integralLowerBound) / DELTA_X_APPROACHES_0));
			sum += Math.abs(f(x))
		}
	
		return sum
	})()
	
	// ********************* controls *********************

	let context: Context
	$: context = "Derivative";

	let selectedFunctionIndex = 0;

	const functions = [
		{id: 'sine', implementation: (x: number) => Math.sin(x), representation: 'f(x) = \\sin(x)'},
		{id: 'const', implementation: (x: number) => 1, representation: 'f(x) = 1'},
		{id: 'linear', implementation: (x: number) => x, representation: 'f(x) = x'},
		{id: 'quadratic', implementation: (x: number) => x * x, representation: 'f(x) = x^2'},
		{id: 'exponential', implementation: (x: number) => Math.exp(x), representation: 'f(x) = e^x'},
		{id: 'cubic', implementation: (x: number) => (x - 1) * (x) * (x + 1), representation: 'f(x) = (x - 1)(x)(x + 1)'},
	];

	let x = 0;
	
	// ********************* equation rendering *********************

	onMount(() => {

		// functions at the top
		for (let f of functions) {
			katex.render(f.representation, document.getElementById(`${f.id}`), {output: 'html'});
		}
	
		renderEquation()
	});

	function renderEquation(): void {
		// katex.render(`x = ${x}`, document.getElementById('xEquals'))
		// katex.render(`\\Delta x = ${deltaX}`, document.getElementById('deltaXEquals'))


		// katex.render('m = \\lim_{\\Delta x \\rightarrow 0} \\frac{f(x + \\Delta x) - f(x)}{\\Delta x}',
		// 	document.getElementById('differenceEquation1'), {output: 'html'})
		// katex.render(`m = \\frac{f(x + ${g(deltaX)}) - f(x)}{${g(deltaX)}}`,
		// 	document.getElementById('differenceEquation2'), {output: 'html'})
		// katex.render(`m = \\frac{f(${g(x)} + ${g(deltaX)}) - f(${g(x)})}{${g(deltaX)}}`,
		// 	document.getElementById('differenceEquation3'), {output: 'html'})
		// katex.render(`m = \\frac{f(${g(x + deltaX)}) - f(${g(x)})}{${g(deltaX)}}`,
		// 	document.getElementById('differenceEquation4'), {output: 'html'})
		// katex.render(`m = ${g(f(x + deltaX) - f(x) / deltaX)}`,
		// 	document.getElementById('differenceEquation5'), {output: 'html'})
	}

	function g(n: number): string {
		return n.toFixed(2)
	}

</script>
<div class="outer">
<div class="container">
	<p>
		<button use:tooltip data-title="How quickly does a curve change?"  class={context === 'Derivative' ? 'highlighted' : ''}  on:click={_ => context = 'Derivative'}>Derivatives</button>
		<button use:tooltip data-title="What is the area under a curve?" class={context === 'Integral' ? 'highlighted' : ''}  on:click={_ => context = 'Integral'}>Integral</button>
	</p>

	{#each functions as f, functionIndex}
		<button class={functionIndex === selectedFunctionIndex ? 'highlighted' : ''} on:click={_ => selectedFunctionIndex = functionIndex}><span id={f.id}>{f.representation}</span></button>
	{/each}
	

	<!-- derivatives -->
	<svg class="cartesian" viewBox="{xMinBound} {yMinBound} {(xMaxBound - xMinBound)} {(yMaxBound - yMinBound)}">
		<g>
			{#if context === 'Derivative'}
				
				<line stroke="red" stroke-dasharray="4,4" fill="none"
					x1={displayedSecantLine.x1} y1={displayedSecantLine.y1}
					x2={displayedSecantLine.x2} y2={displayedSecantLine.y2}
				/>
				<!-- {#if deltaX !== 0 && deltaX !== -0} -->
				<line stroke="grey" stroke-dasharray="4,4" fill="none"
					x1={displayedTangentLine.x1} y1={displayedTangentLine.y1}
					x2={displayedTangentLine.x2} y2={displayedTangentLine.y2}
				/>
				<!-- {/if} -->
				
				<circle use:tooltip data-title={`(${x.toFixed(2)}, ${f(x).toFixed(2)})`} cx={x} cy={f(x)} r=".075" fill="red"></circle>
				<circle use:tooltip data-title={`(${(x + deltaX).toFixed(2)}, ${f(x + deltaX).toFixed(2)})`} cx={x + deltaX} cy={f(x + deltaX)} r=".075" fill="red"></circle>
		
				<!-- why does the y value need to be negative?-->
				<!-- <text x={x + deltaX + 0.5} y={-secant(x + deltaX)} font-size=".4">m={slope(secantPoint1, secantPoint2).toFixed(2)}</text> -->
			{:else}
				<!-- bounds of intergral -->
				<line stroke="black" stroke-dasharray="2,2" fill="none" x1={integralLowerBound} y1={yMinBound} x2={integralLowerBound} y2={yMaxBound} />
				<line stroke="black" stroke-dasharray="2,2" fill="none" x1={integralUpperBound} y1={yMinBound} x2={integralUpperBound} y2={yMaxBound} />
				{#each riemannRectangles as rectangle}
					<rect
						class="riemann-rectangle"
						x={rectangle.lowerLeftCorner.x}
						y={rectangle.lowerLeftCorner.y}
						width={rectangle.width}
						height={rectangle.height}
					/>
			{/each}
			
			{/if}
			<!-- x and y axis -->
			<line stroke="black" fill="none" x1={xMinBound} y1="0" x2={xMaxBound} y2="0" />
			<line stroke="black" fill="none" x1="1"  y1={GRAPH_AXIS_MARK_LENGTH} x2="1"  y2={-GRAPH_AXIS_MARK_LENGTH} />
			<line stroke="black" fill="none" x1="2"  y1={GRAPH_AXIS_MARK_LENGTH} x2="2"  y2={-GRAPH_AXIS_MARK_LENGTH} />
			<line stroke="black" fill="none" x1="3"  y1={GRAPH_AXIS_MARK_LENGTH} x2="3"  y2={-GRAPH_AXIS_MARK_LENGTH} />
			<line stroke="black" fill="none" x1="4"  y1={GRAPH_AXIS_MARK_LENGTH} x2="4"  y2={-GRAPH_AXIS_MARK_LENGTH} />
			<line stroke="black" fill="none" x1="-1" y1={GRAPH_AXIS_MARK_LENGTH} x2="-1" y2={-GRAPH_AXIS_MARK_LENGTH} />
			<line stroke="black" fill="none" x1="-2" y1={GRAPH_AXIS_MARK_LENGTH} x2="-2" y2={-GRAPH_AXIS_MARK_LENGTH} />
			<line stroke="black" fill="none" x1="-3" y1={GRAPH_AXIS_MARK_LENGTH} x2="-3" y2={-GRAPH_AXIS_MARK_LENGTH} />
			<line stroke="black" fill="none" x1="-4" y1={GRAPH_AXIS_MARK_LENGTH} x2="-4" y2={-GRAPH_AXIS_MARK_LENGTH} />
			<line stroke="black" fill="none" x1="0" y1={yMinBound} x2="0" y2={yMaxBound} />
			<line stroke="black" fill="none" x1={-GRAPH_AXIS_MARK_LENGTH} y1="1"  x2={GRAPH_AXIS_MARK_LENGTH} y2="1" />
			<line stroke="black" fill="none" x1={-GRAPH_AXIS_MARK_LENGTH} y1="2"  x2={GRAPH_AXIS_MARK_LENGTH} y2="2" />
			<line stroke="black" fill="none" x1={-GRAPH_AXIS_MARK_LENGTH} y1="3"  x2={GRAPH_AXIS_MARK_LENGTH} y2="3" />
			<line stroke="black" fill="none" x1={-GRAPH_AXIS_MARK_LENGTH} y1="4"  x2={GRAPH_AXIS_MARK_LENGTH} y2="4" />
			<line stroke="black" fill="none" x1={-GRAPH_AXIS_MARK_LENGTH} y1="-1" x2={GRAPH_AXIS_MARK_LENGTH} y2="-1" />
			<line stroke="black" fill="none" x1={-GRAPH_AXIS_MARK_LENGTH} y1="-2" x2={GRAPH_AXIS_MARK_LENGTH} y2="-2" />
			<line stroke="black" fill="none" x1={-GRAPH_AXIS_MARK_LENGTH} y1="-3" x2={GRAPH_AXIS_MARK_LENGTH} y2="-3" />
			<line stroke="black" fill="none" x1={-GRAPH_AXIS_MARK_LENGTH} y1="-4" x2={GRAPH_AXIS_MARK_LENGTH} y2="-4" />
			<!-- graph of function -->
			<polyline stroke="black" fill="none" points={points.map(point => `${point.x},${point.y}`).join(' ')} />
		</g>
	</svg>


	<p id = "SecantVsTangent">
		{#if context === 'Derivative'}
		<span id="SlopeOfSecant" use:tooltip data-title="Slope of the line at the x value if you made the two points infinitely close together">
			Slope of tagent {slopeSecant.toFixed(2)}
		</span>
			| 
		<span use:tooltip data-title="Slope of the line between the points you control">
			Slope of secant: {slopeTangent.toFixed(2)}
		</span> 
		{:else}
			Area of rectangles: {sumBy(riemannRectangles, rectangle => rectangle.width * rectangle.height).toFixed(2)} 
			| Area under curve: {(DELTA_X_APPROACHES_0 * actualSum).toFixed(2)}
		{/if}
	</p>

	{#if context === 'Derivative'}
	

	<label use:tooltip data-title="the distance between your input and the second point" for="deltaX" >Δx: {deltaX.toFixed(2).replace('-0.00', '0.00')}</label>
	<input id="deltaX" type="range" min="-1" step="0.001" max="1"  bind:value={deltaX} on:input={renderEquation}>
	
	<label use:tooltip data-title="the number you input into the function you chose" for="deltaX">x: {x.toFixed(2).replace('-0.00', '0.00')}</label>
	<input id="x" type="range" step="0.01" min={xMinBound} max={xMaxBound} bind:value={x} on:input={renderEquation}>

	{:else}


	<label for="RectangleWidthValue">Rectangle Width: {rectangleWidth}</label>
	<input id="RectangleWidthValue" type="range" min="0.01" step="0.01" max={Math.log(xMaxBound - xMinBound).toFixed(2)}  bind:value={rectangleWidth}>

	<label for="range1">interval bound 1: {integralBound1}</label>
	<input class="bound-range1" type="range" min={xMinBound} max={xMaxBound} step=".01" bind:value={integralBound1}>
	<label for="bound-range2">interval bound 2: {integralBound2}</label>
	<input class="bound-range2" type="range" min={xMinBound} max={xMaxBound} step=".01" bind:value={integralBound2}>
	
	<button class={rectangleStrategy === 'Left' ? 'highlighted' : ''}  on:click={_ => rectangleStrategy = 'Left'}>Left</button>
	<button class={rectangleStrategy === 'Midpoint' ? 'highlighted' : ''}  on:click={_ => rectangleStrategy = 'Midpoint'}>Midpoint</button>
	<button class={rectangleStrategy === 'Right' ? 'highlighted' : ''}  on:click={_ => rectangleStrategy = 'Right'}>Right</button>
	
	{/if}
	<!-- <p id="differenceEquation1"></p>
	<p id="differenceEquation2"></p>
	<p id="differenceEquation3"></p>
	<p id="differenceEquation4"></p>
	<p id="differenceEquation5"></p>
	<p id="xEquals"></p>
	<p id="deltaXEquals"></p> -->
	
</div>
</div>
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.12.0/dist/katex.min.css" integrity="sha384-AfEj0r4/OFrOo5t7NnNe46zW/tFgW6x/bCJG8FqQCEo3+Aro6EYUG4+cU+KJWu/X" crossorigin="anonymous">
<style>
	.outer {
		width: 100%;
	}

	.riemann-rectangle {
		fill: gray;
		stroke: gray;
		stroke-width: 1;
	}

	line, rect, polyline {
		stroke-width: 1px;
		vector-effect: non-scaling-stroke;
	}

	@media (min-width: 640px) {
		main {
			max-width: none;
		}
	}

	input[type="range"], svg.cartesian {
		width: min(65vh, 100%);
		display: block;
		margin: 0 auto;
	}

	.container {
		width: min(70vh, 100%);
		display: block;
		margin: 0 auto;
	}

	/* Flip the vertical axis in <g> to emulate cartesian. */
	svg.cartesian > g {
		transform: scaleY(-1);
	}

	/* Re-flip all <text> element descendants to their original side up. */
	svg.cartesian > g text {
		transform: scaleY(-1);
	}

	.highlighted {
		background-color: limegreen;
	}

	label {
		width: max-content;
		font-size: 20px;
	}

	#SecantVsTangent {
		font-size: 30px;
	}

	#SlopeOfSecant {
		color: red
	}

</style>