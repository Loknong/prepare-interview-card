import { useEffect, useState } from "react";
import axios from "axios";
import ReactMarkdown from "react-markdown";

// Define the type for the extracted TOC and question data
type TocData = { title: string; id: string };
type QuestionData = { question: string; answer: string };

const fetchAndExtractData = async (): Promise<{
  toc: TocData[];
  questions: QuestionData[];
}> => {
  try {
    const response = await axios.get(
      "https://raw.githubusercontent.com/sudheerj/javascript-interview-questions/master/README.md"
    );
    const data = response.data;
    const toc = extractTocData(data);
    const questions = extractQuestionData(data);
    return { toc, questions };
  } catch (error) {
    console.error("Error fetching data:", error);
    return { toc: [], questions: [] };
  }
};

const extractTocData = (markdown: string): TocData[] => {
  const lines = markdown.split("\n");
  const tocData: TocData[] = [];
  let isTocSection = false;

  lines.forEach((line) => {
    if (line.includes("<!-- TOC_START -->")) {
      isTocSection = true;
    } else if (line.includes("<!-- TOC_END -->")) {
      isTocSection = false;
    } else if (isTocSection) {
      const formattedLine = line
        .split("|")[2]
        .trim()
        .replace("[", "")
        .replace("]", "!")
        .split("!")[0];
      if (
        !formattedLine.startsWith("Ques") &&
        !formattedLine.startsWith("---")
      ) {
        const id = formattedLine.toLowerCase().replace(/\s+/g, "-");
        tocData.push({ title: formattedLine, id });
      }
    }
  });

  return tocData;
};

const extractQuestionData = (markdown: string): QuestionData[] => {
  const lines = markdown.split("\n");
  const questionData: QuestionData[] = [];
  let isQuestionSection = false;
  let lastQuestionEndIndex = -1;
  let currentQuestion = "";
  let currentAnswer = "";

  lines.forEach((line, index) => {
    if (line.includes("<!-- QUESTIONS_START -->")) {
      isQuestionSection = true;
    } else if (line.includes("<!-- QUESTIONS_END -->")) {
      // lastQuestionEndIndex = index;
      isQuestionSection = false;
    } else if (isQuestionSection) {
      // console.log(line);

      if (line.includes("###") && !line.includes("####")) {
        if (currentQuestion && currentAnswer) {
          questionData.push({
            question: currentQuestion,
            answer: currentAnswer,
          });
        }

        currentQuestion = line;
        currentAnswer = "";
      } else {
        currentAnswer += line + "\n";
      }
    }
  });

  if (currentQuestion && currentAnswer) {
    questionData.push({ question: currentQuestion, answer: currentAnswer });
  }

  console.log(questionData);

  return questionData;
};

function App() {
  const [tocData, setTocData] = useState<TocData[]>([]);
  const [answerData, setAnswerData] = useState<QuestionData[]>([]);
  const [tooltip, setTooltip] = useState<{
    visible: boolean;
    content: string;
    x: number;
    y: number;
  }>({ visible: false, content: "", x: 0, y: 0 });

  useEffect(() => {
    const loadData = async () => {
      const { toc, questions } = await fetchAndExtractData();
      setTocData(toc);
      setAnswerData(questions);
    };
    loadData();
  }, []);

  const handleMouseOver = (content: string, event: React.MouseEvent) => {
    setTooltip({
      visible: true,
      content: content,
      x: event.clientX,
      y: event.clientY,
    });
  };
  useEffect(() => {
    console.log("tooltip", tooltip);
    return () => {};
  }, [tooltip]);

  const getAnswerForTitle = (title: string) => {
    const match = answerData.find(({ question }) => question.includes(title));
    return match ? match.answer : "No answer found.";
  };

  return (
    <div className="px-[12.5%] my-[80px] flex flex-col gap-4">
      <h1>Extracted TOC Data</h1>
      <div className="h-[400px] overflow-scroll border-red-500 border">
        <ul className="px-[50px]">
          {tocData.map((item, index) => (
            <li
              className="list-decimal hover:bg-fuchsia-300 cursor-pointer relative"
              onClick={(e) => handleMouseOver(getAnswerForTitle(item.title), e)}
              // onMouseOut={handleMouseOut}
              key={index}
            >
              {item.title}
            </li>
          ))}
        </ul>
      </div>
      {tooltip.visible && (
        <div className="bg-gray-300 p-2 max-h-[400px] rounded w-[100%] overflow-auto">
          <ReactMarkdown>{tooltip.content}</ReactMarkdown>
        </div>
      )}
    </div>
  );
}

export default App;
