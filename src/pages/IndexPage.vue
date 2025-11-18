<template>
  <q-page class="column items-center justify-evenly">
    <div>test1 début</div>
    <HelloWorld />
    <div>test1 fin</div>
  </q-page>
</template>

<script setup lang="ts">
import { loadRemote } from '@module-federation/enhanced/runtime';
import { type Component, defineAsyncComponent } from 'vue';

const HelloWorld = defineAsyncComponent(() =>
  // eslint-disable-next-line jsdoc/require-jsdoc
  loadRemote<{ default: Component }>('catalog-ui/HelloWorld').then(
    (mod) => mod!.default
  )
);
</script>
