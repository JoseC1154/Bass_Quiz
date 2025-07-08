let timer;
let currentQuestion = 0;
let correctAnswers = 0;
let totalQuestions = 5;
let secondsPerQuestion = 10;
let correctNote = "";
let questionSet = [];

const noteMap = {
  "C":  ["C", "D", "E", "F", "G", "A", "B"],
  "Db": ["Db", "Eb", "F", "Gb", "Ab", "Bb", "C"],
  "D":  ["D", "E", "F#", "G", "A", "B", "C#"],
  "Eb": ["Eb", "F", "G", "Ab", "Bb", "C", "D"],
  "E":  ["E", "F#", "G#", "A", "B", "C#", "D#"],
  "F":  ["F", "G", "A", "Bb", "C", "D", "E"],
  "F#": ["F#", "G#", "A#", "B", "C#", "D#", "E#"],
  "G":  ["G", "A", "B", "C", "D", "E", "F#"],
  "Ab": ["Ab", "Bb", "C", "Db", "Eb", "F", "G"],
  "A":  ["A", "B", "C#", "D", "E", "F#", "G#"],
  "Bb": ["Bb", "C", "D", "Eb", "F", "G", "A"],
  "B":  ["B", "C#", "D#", "E", "F#", "G#", "A#"]
};

function updateLevel() {
  // Placeholder for future logic
}

function startQuiz() {
  const key = document.getElementById("key").value;
  secondsPerQuestion = parseInt(document.getElementById("secondsInput").value);
  totalQuestions = parseInt(document.getElementById("questionCountInput").value);

  if (!noteMap[key]) return;

  questionSet = Array.from({ length: totalQuestions }, () => {
    const degree = Math.floor(Math.random() * 7);
    return { degree, answer: noteMap[key][degree], key };
  });

  currentQuestion = 0;
  correctAnswers = 0;

  document.getElementById("quizOverlay").style.display = "flex";
  document.getElementById("scaleDisplay").style.display = "none";
  document.getElementById("toggleChartBtn").style.display = "none";

  askQuestion();
}

function askQuestion() {
  clearInterval(timer);

  const { degree, answer, key } = questionSet[currentQuestion];
  correctNote = answer;

  document.getElementById("question").textContent = `What is degree ${degree + 1} in the key of ${key}?`;
  document.getElementById("feedback").textContent = "";

  renderChoices();
  startTimer();
}

function renderChoices() {
  const key = document.getElementById("key").value;
  const scale = [...noteMap[key]]; // make a copy to shuffle
  const container = document.getElementById("choices");
  container.innerHTML = "";

  // Fisher-Yates Shuffle
  for (let i = scale.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [scale[i], scale[j]] = [scale[j], scale[i]];
  }

  scale.forEach(note => {
    const btn = document.createElement("button");
    btn.className = "choice";
    btn.textContent = note;
    btn.onclick = () => checkAnswer(note);
    container.appendChild(btn);
  });
}

function checkAnswer(choice) {
  const feedback = document.getElementById("feedback");

  if (choice === correctNote) {
    correctAnswers++;
    feedback.textContent = "✅ Correct!";
    feedback.style.color = "green";
    disableChoices();

    // Show for 1.5 seconds
    setTimeout(() => {
      feedback.textContent = "";
      currentQuestion++;
      if (currentQuestion < totalQuestions) {
        askQuestion();
      } else {
        endQuiz();
      }
    }, 1500);
  } else {
    feedback.textContent = `❌ Incorrect. Answer: ${correctNote}`;
    feedback.style.color = "red";
    disableChoices();

    // Show for 3 seconds
    setTimeout(() => {
      currentQuestion++;
      if (currentQuestion < totalQuestions) {
        askQuestion();
      } else {
        endQuiz();
      }
    }, 3000);
  }
}

function disableChoices() {
  const buttons = document.querySelectorAll(".choice");
  buttons.forEach(btn => {
    btn.disabled = true;
    btn.classList.add("disabled");
    if (btn.textContent === correctNote) {
      btn.classList.add("correct");
    }
  });
}

function startTimer() {
  let seconds = secondsPerQuestion;
  const timerDisplay = document.getElementById("timer");
  timerDisplay.textContent = seconds;

  timer = setInterval(() => {
    seconds--;
    timerDisplay.textContent = seconds;
    if (seconds <= 0) {
      clearInterval(timer);
      const feedback = document.getElementById("feedback");
      feedback.textContent = `⏰ Time's up! Answer: ${correctNote}`;
      feedback.style.color = "#a00";
      disableChoices();
      setTimeout(() => {
        currentQuestion++;
        if (currentQuestion < totalQuestions) {
          askQuestion();
        } else {
          endQuiz();
        }
      }, 3000);
    }
  }, 1000);
}

function closeQuiz() {
  document.getElementById("quizOverlay").style.display = "none";
  document.getElementById("toggleChartBtn").style.display = "inline-block";
  clearInterval(timer);
}

function endQuiz() {
  document.getElementById("quizOverlay").style.display = "none";
  document.getElementById("result").style.display = "block";
  document.getElementById("score").textContent = `${correctAnswers} / ${totalQuestions}`;
}

function toggleChart() {
  const chart = document.getElementById("scaleDisplay");
  const btn = document.getElementById("toggleChartBtn");

  if (chart.style.display === "none") {
    updateScaleChart();
    chart.style.display = "block";
    btn.textContent = "Hide Scale Chart";
  } else {
    chart.style.display = "none";
    btn.textContent = "Show Scale Chart";
  }
}

function updateScaleChart() {
  const chart = document.getElementById("scaleDisplay");
  const key = document.getElementById("key").value;
  const scale = noteMap[key];

  chart.innerHTML = "";

  const table = document.createElement("table");
  table.style.width = "100%";
  table.style.borderCollapse = "collapse";

  scale.forEach((note, index) => {
    const row = document.createElement("tr");

    const degreeCell = document.createElement("td");
    degreeCell.textContent = `Degree ${index + 1}`;
    degreeCell.style.fontWeight = "bold";
    degreeCell.style.padding = "0.3rem";

    const noteCell = document.createElement("td");
    noteCell.textContent = note;
    noteCell.style.padding = "0.3rem";

    row.appendChild(degreeCell);
    row.appendChild(noteCell);
    table.appendChild(row);
  });

  chart.appendChild(table);
}
