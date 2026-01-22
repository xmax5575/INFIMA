import { render, screen, fireEvent } from "@testing-library/react";
import { describe, test, expect, vi, beforeEach } from "vitest";
import QuestionEditor from "./QuestionEditor";

describe("QuestionEditor Komponenta Test", () => {
  const mockQuestion = {
    text: "Koji je zbroj unutarnjih kuteva u trokutu?",
    type: "multiple_choice",
    difficulty: "srednje",
    options: ["90", "180", "360"],
    correctAnswer: "180"
  };

  const mockOnChange = vi.fn();
  const mockOnRemove = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  test("Ispravan render teksta pitanja i rednog broja", () => {
    render(
      <QuestionEditor 
        question={mockQuestion} 
        index={4}
        onChange={mockOnChange} 
        onRemove={mockOnRemove} 
      />
    );
    
    expect(screen.getByText(/Pitanje 5/i)).toBeInTheDocument();
    
    const textarea = screen.getByPlaceholderText(/Unesi tekst pitanja/i);
    expect(textarea.value).toBe(mockQuestion.text);
  });

  test("Ispravan onChange poziv kad se upiše novi tekst pitanja", () => {
    render(
      <QuestionEditor 
        question={mockQuestion} 
        index={0} 
        onChange={mockOnChange} 
        onRemove={mockOnRemove} 
      />
    );

    const textarea = screen.getByPlaceholderText(/Unesi tekst pitanja/i);
    fireEvent.change(textarea, { target: { value: "Koliko je sati?" } });


    expect(mockOnChange).toHaveBeenCalledWith({ text: "Koliko je sati?" });
  });

  test("Mijenjanje opcija pri promjeni tipa pitanja", () => {
    render(
      <QuestionEditor 
        question={mockQuestion} 
        index={0} 
        onChange={mockOnChange} 
        onRemove={mockOnRemove} 
      />
    );
    
    const typeSelect = screen.getByDisplayValue(/Multiple choice/i);
    
    fireEvent.change(typeSelect, { target: { value: "true_false" } });

    expect(mockOnChange).toHaveBeenCalledWith({ 
      type: "true_false", 
      options: [], 
      correctAnswer: null 
    });
  });

  test("Ispravan onRemove poziv kad se pitanje ukloni'", () => {
    render(
      <QuestionEditor 
        question={mockQuestion} 
        index={0} 
        onChange={mockOnChange} 
        onRemove={mockOnRemove} 
      />
    );

    const removeBtn = screen.getByText(/Ukloni/i);
    fireEvent.click(removeBtn);

    expect(mockOnRemove).toHaveBeenCalledTimes(1);
  });

  test("Prikaz ispravne težine pitanja u selectu", () => {
    render(
      <QuestionEditor 
        question={mockQuestion} 
        index={0} 
        onChange={mockOnChange} 
        onRemove={mockOnRemove} 
      />
    );

    const difficultySelect = screen.getByDisplayValue(/Srednje/i);
    expect(difficultySelect).toBeInTheDocument();
  });
});