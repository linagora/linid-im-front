<template>
  <q-page class="column items-center justify-evenly">
    <div>test1 début</div>
    <HelloWorld/>
    <div>test1 fin</div>
  </q-page>
</template>

<script setup lang="ts">
import {defineAsyncComponent} from 'vue';

const HelloWorld = defineAsyncComponent(() => import('catalog-ui/HelloWorld'));
</script>
