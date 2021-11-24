<script lang="ts">
	import Scene from "./Scene.svelte";

	let sceneW = window.innerWidth,
		sceneH = window.innerHeight;
</script>

<svelte:window bind:innerHeight={sceneH} bind:innerWidth={sceneW} />
<div class="sceneContainer">
	<Scene w={sceneW} h={sceneH} />
</div>

<style>
	:global(body, html) {
		padding: 0;
		margin: 0;
		overflow-x: hidden;
		overflow-y: hidden;
	}

	.sceneContainer {
		background: #333;
		position: absolute;
		top: 0;
		bottom: 0;
		left: 0;
		right: 0;
	}
</style>
