import AnnotationObject from "@/components/annotate/wrapper/annotationObject";
import React from "react";

export interface IAnnotationPageContext {
    curImage: UploadedImage | null,
    labels: Flockfysh.Label[],
    imageIndex: number,
    nextImage: () => void;
    prevImage: () => void;
    curAnnotationData: Map<string, AnnotationObject>;
    refresh: () => void;
    curLabel: Flockfysh.Label | null;
    setCurLabel: (label: Flockfysh.Label | null) => void;
    curPolygon: string;
    isEditing: boolean;
    setIsEditing: (data: boolean) => void;
    setCurPolygon: (data: string) => void;
    addAnnotationObject: (params?: Flockfysh.Point[]) => Promise<void>;
    numImages: number;
}

export const AnnotationPageContext = React.createContext<IAnnotationPageContext>({
    curImage: null,
    labels: [],
    imageIndex: 0,
    curAnnotationData: new Map(),
    numImages: 0,
    nextImage: () => {
    },
    prevImage: () => {
    },
    refresh: () => {
    },
    curLabel: null,
    setCurLabel: () => {
    },
    curPolygon: '',
    setCurPolygon: () => {
    },
    addAnnotationObject: async () => {
    },
    isEditing: false,
    setIsEditing: () => {
    },
});
