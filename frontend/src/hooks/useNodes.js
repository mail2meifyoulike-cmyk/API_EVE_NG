// Nodes management hook
import { useState, useCallback, useEffect } from 'react';
import { nodesAPI } from '../api/nodes';

export const useNodes = (labId) => {
  const [nodes, setNodes] = useState([]);
  const [currentNode, setCurrentNode] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchNodes = useCallback(async () => {
    if (!labId) return;
    setLoading(true);
    setError(null);
    try {
      const response = await nodesAPI.getAll(labId);
      setNodes(response.data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [labId]);

  const fetchNodeById = useCallback(async (nodeId) => {
    if (!labId) return;
    setLoading(true);
    setError(null);
    try {
      const response = await nodesAPI.getById(labId, nodeId);
      setCurrentNode(response.data);
      return response.data;
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [labId]);

  const createNode = useCallback(async (nodeData) => {
    if (!labId) return;
    setLoading(true);
    setError(null);
    try {
      const response = await nodesAPI.create(labId, nodeData);
      setNodes([...nodes, response.data]);
      return response.data;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [labId, nodes]);

  const updateNode = useCallback(async (nodeId, nodeData) => {
    if (!labId) return;
    setLoading(true);
    setError(null);
    try {
      const response = await nodesAPI.update(labId, nodeId, nodeData);
      setNodes(nodes.map(node => node.id === nodeId ? response.data : node));
      if (currentNode?.id === nodeId) {
        setCurrentNode(response.data);
      }
      return response.data;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [labId, nodes, currentNode]);

  const deleteNode = useCallback(async (nodeId) => {
    if (!labId) return;
    setLoading(true);
    setError(null);
    try {
      await nodesAPI.delete(labId, nodeId);
      setNodes(nodes.filter(node => node.id !== nodeId));
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [labId, nodes]);

  const startNode = useCallback(async (nodeId) => {
    if (!labId) return;
    setLoading(true);
    setError(null);
    try {
      const response = await nodesAPI.start(labId, nodeId);
      setNodes(nodes.map(node => node.id === nodeId ? response.data : node));
      return response.data;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [labId, nodes]);

  const stopNode = useCallback(async (nodeId) => {
    if (!labId) return;
    setLoading(true);
    setError(null);
    try {
      const response = await nodesAPI.stop(labId, nodeId);
      setNodes(nodes.map(node => node.id === nodeId ? response.data : node));
      return response.data;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [labId, nodes]);

  // Fetch nodes on mount or when labId changes
  useEffect(() => {
    fetchNodes();
  }, [labId, fetchNodes]);

  return {
    nodes,
    currentNode,
    loading,
    error,
    fetchNodes,
    fetchNodeById,
    createNode,
    updateNode,
    deleteNode,
    startNode,
    stopNode,
  };
};