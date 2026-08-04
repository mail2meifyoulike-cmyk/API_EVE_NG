# Frontend Labs Tests

import { renderHook, act, waitFor } from '@testing-library/react';
import { useLabs } from '../hooks/useLabs';
import * as labsAPI from '../api/labs';

jest.mock('../api/labs');

describe('Labs Hook', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should fetch labs on mount', async () => {
    const mockLabs = [
      { id: 1, name: 'Lab 1', status: 'running' },
      { id: 2, name: 'Lab 2', status: 'stopped' },
    ];

    labsAPI.getAll.mockResolvedValue({ data: mockLabs });

    const { result } = renderHook(() => useLabs());

    expect(result.current.loading).toBeTruthy();

    await waitFor(() => {
      expect(result.current.loading).toBeFalsy();
    });

    expect(result.current.labs).toEqual(mockLabs);
    expect(labsAPI.getAll).toHaveBeenCalled();
  });

  it('should create a lab', async () => {
    const newLab = { id: 1, name: 'New Lab', status: 'stopped' };
    labsAPI.create.mockResolvedValue({ data: newLab });
    labsAPI.getAll.mockResolvedValue({ data: [] });

    const { result } = renderHook(() => useLabs());

    await waitFor(() => {
      expect(result.current.loading).toBeFalsy();
    });

    await act(async () => {
      await result.current.createLab({ name: 'New Lab' });
    });

    expect(labsAPI.create).toHaveBeenCalledWith({ name: 'New Lab' });
    expect(result.current.labs).toContainEqual(newLab);
  });

  it('should update a lab', async () => {
    const existingLab = { id: 1, name: 'Lab 1', status: 'stopped' };
    const updatedLab = { id: 1, name: 'Updated Lab', status: 'stopped' };

    labsAPI.getAll.mockResolvedValue({ data: [existingLab] });
    labsAPI.update.mockResolvedValue({ data: updatedLab });

    const { result } = renderHook(() => useLabs());

    await waitFor(() => {
      expect(result.current.labs.length).toBeGreaterThan(0);
    });

    await act(async () => {
      await result.current.updateLab(1, { name: 'Updated Lab' });
    });

    expect(labsAPI.update).toHaveBeenCalledWith(1, { name: 'Updated Lab' });
    expect(result.current.labs[0]).toEqual(updatedLab);
  });

  it('should delete a lab', async () => {
    const lab = { id: 1, name: 'Lab 1', status: 'stopped' };
    labsAPI.getAll.mockResolvedValue({ data: [lab] });
    labsAPI.delete.mockResolvedValue({ data: {} });

    const { result } = renderHook(() => useLabs());

    await waitFor(() => {
      expect(result.current.labs.length).toBeGreaterThan(0);
    });

    await act(async () => {
      await result.current.deleteLab(1);
    });

    expect(labsAPI.delete).toHaveBeenCalledWith(1);
    expect(result.current.labs).toHaveLength(0);
  });

  it('should start a lab', async () => {
    const stoppedLab = { id: 1, name: 'Lab 1', status: 'stopped' };
    const runningLab = { id: 1, name: 'Lab 1', status: 'running' };

    labsAPI.getAll.mockResolvedValue({ data: [stoppedLab] });
    labsAPI.start.mockResolvedValue({ data: runningLab });

    const { result } = renderHook(() => useLabs());

    await waitFor(() => {
      expect(result.current.labs.length).toBeGreaterThan(0);
    });

    await act(async () => {
      await result.current.startLab(1);
    });

    expect(labsAPI.start).toHaveBeenCalledWith(1);
    expect(result.current.labs[0].status).toBe('running');
  });

  it('should stop a lab', async () => {
    const runningLab = { id: 1, name: 'Lab 1', status: 'running' };
    const stoppedLab = { id: 1, name: 'Lab 1', status: 'stopped' };

    labsAPI.getAll.mockResolvedValue({ data: [runningLab] });
    labsAPI.stop.mockResolvedValue({ data: stoppedLab });

    const { result } = renderHook(() => useLabs());

    await waitFor(() => {
      expect(result.current.labs.length).toBeGreaterThan(0);
    });

    await act(async () => {
      await result.current.stopLab(1);
    });

    expect(labsAPI.stop).toHaveBeenCalledWith(1);
    expect(result.current.labs[0].status).toBe('stopped');
  });

  it('should handle errors', async () => {
    const error = new Error('API Error');
    labsAPI.getAll.mockRejectedValue(error);

    const { result } = renderHook(() => useLabs());

    await waitFor(() => {
      expect(result.current.loading).toBeFalsy();
    });

    expect(result.current.error).toBe('API Error');
  });
});
