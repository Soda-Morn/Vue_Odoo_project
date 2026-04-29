<script setup>
import { ref, watch, onMounted, onBeforeUnmount } from 'vue'
import {
  Chart, BarController, BarElement,
  CategoryScale, LinearScale, Tooltip,
} from 'chart.js'

Chart.register(BarController, BarElement, CategoryScale, LinearScale, Tooltip)

const props = defineProps({
  title:  { type: String, required: true },
  items:  { type: Array,  required: true },
  bg:     { type: String, required: true },
  border: { type: String, required: true },
})

const canvas = ref(null)
let chart = null

const buildConfig = () => ({
  type: 'bar',
  data: {
    labels:   props.items.map(i => i.label),
    datasets: [{
      data:            props.items.map(i => +i.total.toFixed(2)),
      backgroundColor: props.bg,
      borderColor:     props.border,
      borderWidth:     1,
      borderRadius:    4,
      borderSkipped:   false,
    }],
  },
  options: {
    responsive:          true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: { callbacks: { label: ctx => ` ${ctx.parsed.y.toFixed(2)} L` } },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: { callback: v => `${v} L` },
        grid:  { color: 'rgba(0,0,0,0.05)' },
      },
      x: { grid: { display: false } },
    },
  },
})

onMounted(() => { chart = new Chart(canvas.value, buildConfig()) })

onBeforeUnmount(() => chart?.destroy())

watch(() => props.items, () => {
  if (!chart) return
  chart.data.labels            = props.items.map(i => i.label)
  chart.data.datasets[0].data  = props.items.map(i => +i.total.toFixed(2))
  chart.update()
}, { deep: true })
</script>

<template>
  <div class="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
    <h2 class="text-sm font-semibold text-gray-700 mb-4">{{ title }}</h2>
    <div class="h-64">
      <canvas ref="canvas"></canvas>
    </div>
  </div>
</template>
