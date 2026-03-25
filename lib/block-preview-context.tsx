"use client";
import { createContext, useContext } from "react";

export const BlockPreviewContext = createContext(false);
export const useBlockPreview = () => useContext(BlockPreviewContext);
