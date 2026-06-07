<script>
import '../app.css';
import { setInitialClassState } from '@skeletonlabs/skeleton';
</script>

<svelte:head>
  {@html `<script nonce="%sveltekit.nonce%">(${setInitialClassState.toString()})();</script>`}
</svelte:head>

<slot />
