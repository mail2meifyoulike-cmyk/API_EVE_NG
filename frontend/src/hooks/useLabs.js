// Labs management hook
import { useState, useCallback, useEffect } from 'react';
import { labsAPI } from '../api/labs';

export const useLabs = (labId = null) => {
  const [labs, setLabs] = useState([]);
  const [currentLab, setCurrentLab] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchLabs = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await labsAPI.getAll();
      setLabs(response.data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchLabById = useCallback(async (id) => {
    setLoading(true);
    setError(null);
    try {
      const response = await labsAPI.getById(id);
      setCurrentLab(response.data);
      return response.data;
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const createLab = useCallback(async (labData) => {
    setLoading(true);
    setError(null);
    try {
      const response = await labsAPI.create(labData);
      setLabs([...labs, response.data]);
      return response.data;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [labs]);

  const updateLab = useCallback(async (id, labData) => {
    setLoading(true);
    setError(null);
    try {
      const response = await labsAPI.update(id, labData);
      setLabs(labs.map(lab => lab.id === id ? response.data : lab));
      if (currentLab?.id === id) {
        setCurrentLab(response.data);
      }
      return response.data;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [labs, currentLab]);

  const deleteLab = useCallback(async (id) => {
    setLoading(true);
    setError(null);
    try {
      await labsAPI.delete(id);
      setLabs(labs.filter(lab => lab.id !== id));
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [labs]);

  const startLab = useCallback(async (id) => {
    setLoading(true);
    setError(null);
    try {
      const response = await labsAPI.start(id);
      setLabs(labs.map(lab => lab.id === id ? response.data : lab));
      return response.data;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [labs]);

  const stopLab = useCallback(async (id) => {
    setLoading(true);
    setError(null);
    try {
      const response = await labsAPI.stop(id);
      setLabs(labs.map(lab => lab.id === id ? response.data : lab));
      return response.data;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [labs]);

  // Fetch labs on mount
  useEffect(() => {
    fetchLabs();
  }, [fetchLabs]);

  // Fetch specific lab if labId provided
  useEffect(() => {
    if (labId) {
      fetchLabById(labId);
    }
  }, [labId, fetchLabById]);

  return {
    labs,
    currentLab,
    loading,
    error,
    fetchLabs,
    fetchLabById,
    createLab,
    updateLab,
    deleteLab,
    startLab,
    stopLab,
  };
};