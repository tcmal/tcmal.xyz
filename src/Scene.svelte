<script lang="ts">
    import { onMount } from "svelte";
    import { createScene } from "./scene";

    let canvas;
    let highlightContainer;
    onMount(() => {
        createScene(canvas, highlightContainer);
    });
</script>

<div>
    <svg
        version="2"
        xmlns="http://www.w3.org/2000/svg"
        class="highlightContainer"
        bind:this={highlightContainer}
    >
        <style>
            polygon {
                fill: red;
            }
            polygon:hover {
                fill: blue;
            }
        </style>
    </svg>
    <canvas bind:this={canvas} />
</div>

<style>
    div {
        position: absolute;
        top: 0;
        bottom: 0;
        left: 0;
        right: 0;
    }
    canvas {
        position: absolute;
        z-index: 0;
        top: 0;
        bottom: 0;
        left: 0;
        right: 0;
    }

    .highlightContainer {
        position: absolute;
        z-index: 2;
        top: 0;
        bottom: 0;
        left: 0;
        right: 0;
    }
</style>
