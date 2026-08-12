export interface TaskSettings {
  task1_pmax: number; // Round 1 Quiz (Default 100)
  task2_pmax: number; // Round 2 Workflow (Default 100)
  task3_pmax: number; // Round 3 AI vs Real (Default 100)
  task4_pmax: number; // Round 4 Spot Data (Default 100)
  task5_pmax: number; // Round 5 Password Unlock (Default 0)
  r3_question_count: number; // Round 3 questions per slot (Default 1)
  r4_question_count: number; // Round 4 questions per slot (Default 1)
}

let currentSettings: TaskSettings = {
  task1_pmax: 100,
  task2_pmax: 100,
  task3_pmax: 100,
  task4_pmax: 100,
  task5_pmax: 0,
  r3_question_count: 1,
  r4_question_count: 1,
};

export function getTaskSettings(): TaskSettings {
  return { ...currentSettings };
}

export function updateTaskSettings(newSettings: Partial<TaskSettings>): TaskSettings {
  currentSettings = {
    ...currentSettings,
    ...newSettings,
  };
  return { ...currentSettings };
}

export function getPMaxForRound(roundNumber: number): number {
  switch (roundNumber) {
    case 1:
      return currentSettings.task1_pmax;
    case 2:
      return currentSettings.task2_pmax;
    case 3:
      return currentSettings.task3_pmax;
    case 4:
      return currentSettings.task4_pmax;
    case 5:
      return currentSettings.task5_pmax;
    default:
      return 100;
  }
}

export function getRoundQuestionLimit(roundNumber: number): number {
  if (roundNumber === 3) return currentSettings.r3_question_count || 1;
  if (roundNumber === 4) return currentSettings.r4_question_count || 1;
  if (roundNumber === 2) return 1;
  return 1;
}
