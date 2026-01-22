import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import TrueFalseEditor from './TrueFalseEditor';

describe('TrueFalseEditor Komponenta Test', () => {
  const mockQuestion = { correctAnswer: true };
  const mockOnChange = vi.fn();

  it('Kada se klikne da je ispravan odgovor "Točno", poziva onChange s "true"', () => {
    const onChange = vi.fn();
    render(<TrueFalseEditor question={{ correctAnswer: false }} onChange={onChange} />);

    const radioTocno = screen.getAllByLabelText(/točno/i)[0];
    fireEvent.click(radioTocno);

    expect(onChange).toHaveBeenCalledWith({ correctAnswer: true });
  });

  it('"Točno" je označen ispravan odgovor kada je correctAnswer true', () => {
    render(<TrueFalseEditor question={mockQuestion} onChange={mockOnChange} />);

    const radioButtons = screen.getAllByRole('radio');
    
    expect(radioButtons[0]).toBeChecked();
    expect(radioButtons[1]).not.toBeChecked();
  });

  it('Kada se klikne da je ispravan odgovor "Netočno", poziva onChange s "false"', () => {
    const onChange = vi.fn();
    render(<TrueFalseEditor question={{ correctAnswer: true }} onChange={onChange} />);

    const radioNetocno = screen.getAllByLabelText(/netočno/i)[0];
    fireEvent.click(radioNetocno);

    expect(onChange).toHaveBeenCalledWith({ correctAnswer: false });
  });
});