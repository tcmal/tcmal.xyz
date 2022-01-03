<script lang="ts">
	import Scene from "./Scene.svelte";
</script>

<svelte:window />
<div class="sceneContainer">
	<Scene />
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
