declare global {
    namespace Flockfysh {
        type AnnotationTool = 'boundingBox' | 'ellipse' | 'polygon' | 'line';
        type AssetStages = 'uploaded' | 'feedback' | 'completed';
        type AssetType = 'image' | 'video';

        interface Label {
            _id: string;
            name: string;
            tag: string;
            color: string;
            tool: Flockfysh.AnnotationTool,
        }
        interface TemporaryAnnotation{
            id: string;
        }
        interface Recipe {
            _id: string;
            name: string;
            immutable: boolean;
            user: string;
            createdAt: Date;
        }

        interface RecipeWithLabels extends Recipe {
            labels: Flockfysh.Label[]
        }

        interface Dataset {
            _id: string;
            name: string;
            description?: string;
            tags: string[];
            subTags: string[];
            user: string;
            type: string;
            createdAt: Date;
            price: number;
            public: boolean;
            updatedAt: Date;
            stage: string;
        }

        interface PopulatedDataset extends Dataset{
            size: Flockfysh.DatasetSize,
            assetCounts: Flockfysh.DatasetAssetCounts,
            annotationCounts: Flockfysh.DatasetAnnotationCounts,
        };

        interface DatasetAssetCounts {
            byStage: Record<Flockfysh.AssetStages, number>;
            total: number;
            byAnnotationStatus: {
                annotated: number,
                unannotated: number,
            };
        }

        interface DatasetAnnotationCounts {
            total: number;
        }

        interface DatasetSize {
            byStage: Record<Flockfysh.AssetStages, number>;
            total: {
                cloud: number,
                cluster: number,
                total: number,
            };
        }

        interface Asset {
            _id: string;
            type: Flockfysh.AssetType;
            stage: Flockfysh.AssetStages;
            uploadedAt: Date;
            dataset: string;
            size: number;
            url: string;
            displayName: string;
        }
    }

    namespace Api {
        interface Response<T> {
            success: true,
            data: T,
        }

        interface PaginatedResponse<T> {
            success: true,
            data: T,
            meta: {
                previous?: string,
                next?: string,
                hasPrevious: boolean,
                hasNext: boolean,
            }
        }
    }
}

export {};
