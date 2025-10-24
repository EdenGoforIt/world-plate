import { renderHook, act } from '@testing-library/react-native';
import { useGreeting } from '../../hooks/useGreeting';

describe('useGreeting', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('returns Good Morning for morning hours', () => {
    const mockDate = new Date('2024-01-01 09:00:00');
    jest.spyOn(global, 'Date').mockImplementation(() => mockDate);

    const { result } = renderHook(() => useGreeting());

    expect(result.current).toBe('Good Morning');
  });

  it('returns Good Afternoon for afternoon hours', () => {
    const mockDate = new Date('2024-01-01 14:00:00');
    jest.spyOn(global, 'Date').mockImplementation(() => mockDate);

    const { result } = renderHook(() => useGreeting());

    expect(result.current).toBe('Good Afternoon');
  });

  it('returns Good Evening for evening hours', () => {
    const mockDate = new Date('2024-01-01 19:00:00');
    jest.spyOn(global, 'Date').mockImplementation(() => mockDate);

    const { result } = renderHook(() => useGreeting());

    expect(result.current).toBe('Good Evening');
  });

  it('updates greeting when time changes', () => {
    const mockMorning = new Date('2024-01-01 09:00:00');
    jest.spyOn(global, 'Date').mockImplementation(() => mockMorning);

    const { result, rerender } = renderHook(() => useGreeting());
    expect(result.current).toBe('Good Morning');

    // Simulate time passing to afternoon
    const mockAfternoon = new Date('2024-01-01 14:00:00');
    jest.spyOn(global, 'Date').mockImplementation(() => mockAfternoon);

    act(() => {
      jest.advanceTimersByTime(60000); // Advance by 1 minute
      rerender({});
    });

    expect(result.current).toBe('Good Afternoon');
  });

  it('cleans up interval on unmount', () => {
    const clearIntervalSpy = jest.spyOn(global, 'clearInterval');

    const { unmount } = renderHook(() => useGreeting());
    unmount();

    expect(clearIntervalSpy).toHaveBeenCalled();
  });
});