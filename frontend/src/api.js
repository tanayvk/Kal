import { useQuery } from "react-query";
import axios from "axios";
import { getToken } from "./stores/auth";

const API_ENDPOINT = import.meta.env.DEV ? "http://localhost:3000/api" : "/api";

export const login = async (username, password) => {
  const response = await fetch(`${API_ENDPOINT}/token`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ username, password }),
  });
  return response;
};

export const useSenders = () => {
  return useQuery("senders", async () => {
    const response = await axios.get(`${API_ENDPOINT}/senders`, {
      headers: {
        Authorization: `Bearer ${getToken()}`,
      },
    });
    return response.data;
  });
};

export const useTemplates = () => {
  return useQuery("templates", async () => {
    const response = await axios.get(`${API_ENDPOINT}/emails?templates=true`, {
      headers: {
        Authorization: `Bearer ${getToken()}`,
      },
    });
    return response.data;
  });
};

export const useEmails = () => {
  return useQuery("emails", async () => {
    const response = await axios.get(`${API_ENDPOINT}/emails`, {
      headers: {
        Authorization: `Bearer ${getToken()}`,
      },
    });
    return response.data;
  });
};

export const useSubscribers = () => {
  return useQuery("subscribers", async () => {
    const response = await axios.get(`${API_ENDPOINT}/subscribers`, {
      headers: {
        Authorization: `Bearer ${getToken()}`,
      },
    });
    return response.data;
  });
};

export const useLists = () => {
  return useQuery("lists", async () => {
    const response = await axios.get(`${API_ENDPOINT}/lists`, {
      headers: {
        Authorization: `Bearer ${getToken()}`,
      },
    });
    return response.data;
  });
};

export const useConfig = () => {
  return useQuery(["config"], async () => {
    const response = await axios.get(`${API_ENDPOINT}/config`, {
      headers: {
        Authorization: `Bearer ${getToken()}`,
      },
    });
    return response.data;
  });
};

export const useEmail = (id) => {
  return useQuery(["emails", id], async () => {
    const response = await axios.get(`${API_ENDPOINT}/emails/${id}`, {
      headers: {
        Authorization: `Bearer ${getToken()}`,
      },
    });
    return response.data;
  });
};

export const useList = (id) => {
  return useQuery(["lists", id], async () => {
    const response = await axios.get(`${API_ENDPOINT}/lists/${id}`, {
      headers: {
        Authorization: `Bearer ${getToken()}`,
      },
    });
    return response.data;
  });
};

export const useSender = (id) => {
  return useQuery(["senders", id], async () => {
    const response = await axios.get(`${API_ENDPOINT}/senders/${id}`, {
      headers: {
        Authorization: `Bearer ${getToken()}`,
      },
    });
    return response.data;
  });
};

export const useSmtpServer = (id) => {
  return useQuery(["smtpServers", id], async () => {
    const response = await axios.get(`${API_ENDPOINT}/smtp/${id}`, {
      headers: {
        Authorization: `Bearer ${getToken()}`,
      },
    });
    return response.data;
  });
};

export const useSmtpServers = () => {
  return useQuery("smtpServers", async () => {
    const response = await axios.get(`${API_ENDPOINT}/smtp`, {
      headers: {
        Authorization: `Bearer ${getToken()}`,
      },
    });
    return response.data;
  });
};

export const createSmtpServer = async (smtpConfig) => {
  const response = await axios.post(
    `${API_ENDPOINT}/smtp`,
    { smtpConfig },
    {
      headers: {
        Authorization: `Bearer ${getToken()}`,
      },
    },
  );
  return response.data;
};

export const updateSmtpServer = async ({ id, smtpConfig }) => {
  const response = await axios.put(
    `${API_ENDPOINT}/smtp/${id}`,
    { smtpConfig },
    {
      headers: {
        Authorization: `Bearer ${getToken()}`,
      },
    },
  );
  return response.data;
};

export const createSender = async (senderData) => {
  const response = await axios.post(`${API_ENDPOINT}/senders`, senderData, {
    headers: {
      Authorization: `Bearer ${getToken()}`,
    },
  });
  return response.data;
};

export const updateConfig = async (configData) => {
  const response = await axios.put(`${API_ENDPOINT}/config`, configData, {
    headers: {
      Authorization: `Bearer ${getToken()}`,
    },
  });
  return response.data;
};

export const updateSender = async ({ id, senderData }) => {
  const response = await axios.put(
    `${API_ENDPOINT}/senders/${id}`,
    senderData,
    {
      headers: {
        Authorization: `Bearer ${getToken()}`,
      },
    },
  );
  return response.data;
};

export const createList = async (listData) => {
  const response = await axios.post(`${API_ENDPOINT}/lists`, listData, {
    headers: {
      Authorization: `Bearer ${getToken()}`,
    },
  });
  return response.data;
};

export const updateList = async ({ id, listData }) => {
  const response = await axios.put(`${API_ENDPOINT}/lists/${id}`, listData, {
    headers: {
      Authorization: `Bearer ${getToken()}`,
    },
  });
  return response.data;
};

export const createEmail = async (emailData) => {
  const response = await axios.post(`${API_ENDPOINT}/emails`, emailData, {
    headers: {
      Authorization: `Bearer ${getToken()}`,
    },
  });
  return response.data;
};

export const updateEmail = async ({ id, emailData }) => {
  const response = await axios.put(`${API_ENDPOINT}/emails/${id}`, emailData, {
    headers: {
      Authorization: `Bearer ${getToken()}`,
    },
  });
  return response.data;
};

export const deleteList = async (id) => {
  const response = await axios.delete(`${API_ENDPOINT}/lists/${id}`, {
    headers: {
      Authorization: `Bearer ${getToken()}`,
    },
  });
  return response.data;
};

export const deleteEmail = async (id) => {
  const response = await axios.delete(`${API_ENDPOINT}/emails/${id}`, {
    headers: {
      Authorization: `Bearer ${getToken()}`,
    },
  });
  return response.data;
};

export const deleteSender = async (id) => {
  const response = await axios.delete(`${API_ENDPOINT}/senders/${id}`, {
    headers: {
      Authorization: `Bearer ${getToken()}`,
    },
  });
  return response.data;
};

export const deleteSmtpServer = async (id) => {
  const response = await axios.delete(`${API_ENDPOINT}/smtp/${id}`, {
    headers: {
      Authorization: `Bearer ${getToken()}`,
    },
  });
  return response.data;
};

export const sendEmail = async ({ id, senderId, filter, time, lists }) => {
  const response = await axios.post(
    `${API_ENDPOINT}/emails/${id}/send`,
    {
      senderId,
      filter,
      time,
      lists,
    },
    {
      headers: {
        Authorization: `Bearer ${getToken()}`,
      },
    },
  );
  return response.data;
};

export const updateSubscriber = async ({ name, email, lists, id, uuid }) => {
  const response = await axios.put(`${API_ENDPOINT}/subscriber/${id}/${uuid}`, {
    name,
    email,
    lists,
  });
  return response.data;
};

export const subscribe = async ({ name, email, lists }) => {
  const response = await axios.post(`${API_ENDPOINT}/subscribe`, {
    name,
    email,
    lists,
  });
  return response.data;
};

export const getSubs = async ({ lists, filter }) => {
  const response = await axios.post(
    `${API_ENDPOINT}/subs/check`,
    {
      lists,
      filter,
    },
    {
      headers: {
        Authorization: `Bearer ${getToken()}`,
      },
    },
  );
  return response.data;
};

export const useSubInfo = ({ id, uuid }) => {
  const endpoint =
    id && uuid
      ? `${API_ENDPOINT}/sub/${id}/${uuid}`
      : `${API_ENDPOINT}/sub-info`;
  return useQuery("subInfo", async () => {
    const response = await axios.get(endpoint);
    return response.data;
  });
};
