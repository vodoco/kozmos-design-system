<script setup lang="ts">
import { ref, computed } from 'vue';
import { KozmosButton, KozmosCheckbox, KozmosBadge, KozmosInput } from '@kozmos-ds/vue';

interface Task {
  id: number;
  text: string;
  completed: boolean;
}

const tasks = ref<Task[]>([
  { id: 1, text: 'Validate React Virtual DOM', completed: true },
  { id: 2, text: 'Deploy to Android Jetpack', completed: false }
]);

const newTask = ref('');

const addTask = () => {
  if (newTask.value.trim()) {
    tasks.value.push({ id: Date.now(), text: newTask.value.trim(), completed: false });
    newTask.value = '';
  }
};

const toggleTask = (id: number) => {
  const task = tasks.value.find(t => t.id === id);
  if (task) {
    task.completed = !task.completed;
  }
};

const removeTask = (id: number) => {
  tasks.value = tasks.value.filter(t => t.id !== id);
};

const completedCount = computed(() => tasks.value.filter(t => t.completed).length);
</script>

<template>
  <div style="padding: 2rem; display: flex; flex-direction: column; gap: 2rem; max-width: 600px; margin: 0 auto; font-family: system-ui, sans-serif;">
    
    <div style="display: flex; justify-content: space-between; align-items: center;">
      <h1 style="font-size: 2.5rem; font-weight: bold; margin: 0;">Kozmos Tasks</h1>
      <KozmosBadge variant="outline">
        {{ completedCount }} / {{ tasks.length }} Done
      </KozmosBadge>
    </div>

    <div style="display: flex; gap: 1rem;">
      <div style="flex: 1;">
        <KozmosInput 
          v-model="newTask" 
          placeholder="What needs to be done?" 
          @keydown.enter="addTask"
        />
      </div>
      <KozmosButton variant="default" @click="addTask">Add Task</KozmosButton>
    </div>

    <div style="display: flex; flex-direction: column; gap: 1rem;">
      <div 
        v-for="task in tasks" 
        :key="task.id" 
        style="padding: 1rem; border: 1px solid rgba(255,255,255,0.1); border-radius: 8px; display: flex; align-items: center; justify-content: space-between; background: rgba(255,255,255,0.02);"
      >
        <div style="display: flex; align-items: center; gap: 1rem;">
          <KozmosCheckbox 
            :checked="task.completed" 
            @checkedChange="() => toggleTask(task.id)" 
          />
          <span :style="{ textDecoration: task.completed ? 'line-through' : 'none', opacity: task.completed ? 0.6 : 1 }">
            {{ task.text }}
          </span>
        </div>
        <KozmosButton variant="destructive" @click="removeTask(task.id)">Delete</KozmosButton>
      </div>
      
      <p v-if="tasks.length === 0" style="text-align: center; opacity: 0.5;">All tasks completed!</p>
    </div>

  </div>
</template>

<style>
body {
  margin: 0;
  background-color: #1e1e24;
  color: #fff;
}
</style>
