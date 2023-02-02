import React from 'react';
import {useState, useEffect} from 'react';

import GradientLink from '../../components/UI/gradientLink/gradientLink';
import Label from '../../components/dashboard/annotate/label/label';
import AnnotationWrapper from '../../components/dashboard/annotate/wrapper/annotationWrapper';
import Loading from '../../components/loading/loading';
import {LABEL_COLORS} from "../../settings";
import {RxArrowLeft, RxArrowRight, RxPlus} from 'react-icons/rx';
import {useNavigate, useParams} from 'react-router-dom';
import api from "../../helpers/api";
import classes from './annotate.module.css';

export interface AnnotationBox {
    x: number;
    y: number;
    width: number;
    height: number;
}
export interface IAnnotationPageContext {
    curImage: UploadedImage | null,
    labels: string[],
    imageIndex: number,
    nextImage: () => void;
    prevImage: () => void;
    curAnnotationData: (AnnotationBox | undefined)[],
    removeAnnotationBox: (id: number) => void;
    updateAnnotationBox: (id: number, data: AnnotationBox) => void;
}
export const AnnotationPageContext = React.createContext<IAnnotationPageContext>({
    curImage: null,
    labels: [],
    imageIndex: 0,
    curAnnotationData: [],
    removeAnnotationBox: () => {
    },
    updateAnnotationBox: () => {
    },
    nextImage: () => {
    },
    prevImage: () => {
    },
});
export default function Annotate() {
    const params = useParams();
    const navigate = useNavigate();

    const [labels, setLabels] = useState<string[]>([]);
    const [imageIds, setImageIds] = useState<string[]>([]);
    const [curImage, setCurImage] = useState<UploadedImage | null>(null);
    const [imageIndex, setImageIndex] = useState(0);
    const [{curAnnotationData}, setCurAnnotationData] = useState<{
        curAnnotationData: (AnnotationBox | undefined)[],
    }>({
        curAnnotationData: [],
    });

    useEffect(() => {
        if (params.datasetId) {
            void async function getCurrentDataset() {
                try {
                    const uploadedImages = (await api.get(`/api/dataset/${params.datasetId}/uploadedImageIds`)).data.data;
                    const datasetLabels = (await api.get(`/api/dataset/${params.datasetId}/labels`)).data.data;
                    setImageIndex(0);
                    setImageIds(uploadedImages);
                    setLabels(datasetLabels);
                } catch (e) {
                    console.error(e);
                    navigate("/404");
                }
            }();
        } else {
            navigate("/404");
        }
    }, [params.datasetId]);
    useEffect(() => {
        if (imageIds.length) {
            void async function getCurrentImageInfo() {
                try {
                    const fetchedImage = (await api.get<{ success: boolean, data: UploadedImage }>(`/api/image/${imageIds[imageIndex]}`)).data.data;
                    setCurImage(fetchedImage);
                } catch (e) {
                    console.error(e);
                }
            }();
        }
    }, [imageIds, imageIndex]);

    function nextImage() {
        if (imageIndex + 1 < imageIds.length) {
            setImageIndex(imageIndex + 1);
        }
    }

    function prevImage() {
        if (imageIndex - 1 >= 0) {
            setImageIndex(imageIndex - 1);
        }
    }

    function removeAnnotationBox(boxId: number) {
        curAnnotationData[boxId] = undefined;
        setCurAnnotationData({curAnnotationData});
    }

    function updateAnnotationBox(boxId: number, data: AnnotationBox) {
        curAnnotationData[boxId] = data;
        setCurAnnotationData({curAnnotationData});
    }

    return <AnnotationPageContext.Provider value={{
        curImage,
        labels,
        nextImage,
        prevImage,
        imageIndex,
        curAnnotationData,
        removeAnnotationBox,
        updateAnnotationBox,
    }}>
        <AnnotateInner></AnnotateInner>
    </AnnotationPageContext.Provider>;
}

function AnnotateInner() {
    const {
        curImage,
        labels,
        nextImage,
        prevImage,
        imageIndex,
        curAnnotationData,
        removeAnnotationBox,
        updateAnnotationBox,
    } = React.useContext(AnnotationPageContext);

    if (!curImage) {
        return <Loading/>;
    }

    return (
        <div className={classes.annotateContainer}>
            <div className={classes.headingContainer}>
                <h1 className={classes.heading}>Picture - {imageIndex + 1}/50</h1>
            </div>
            <div className={classes.submitButtonContainer}>
                <GradientLink to="/" text="Initiate training" gradientDirection="rightToLeft"
                              className={classes.initiateTrainingButton}/>
            </div>
            <div className={classes.leftContainer}>
                <AnnotationWrapper></AnnotationWrapper>
            </div>

            <div className={classes.rightContainer}>
                <div className={classes.box}/>
            </div>
            <div className={classes.labelContainer}>
                <div className={classes.labelList}>
                    {
                        labels.map(function generateLabelButton(labelName, index) {
                            let active = !!curAnnotationData[index];
                            return <Label
                                key={index}
                                dotColor={LABEL_COLORS[index]}
                                active={active}
                                onClick={() => {
                                    if (active) {
                                        removeAnnotationBox(index);
                                    } else {
                                        updateAnnotationBox(index, {
                                            x: 0.5,
                                            y: 0.5,
                                            height: 0.5,
                                            width: 0.5,
                                        });
                                    }
                                }}
                            >{labelName}</Label>;
                        })
                    }
                </div>
                <button className={classes.addLabelButton}><RxPlus/></button>
            </div>
            <div className={classes.switchImageContainer}>
                <button className={classes.switchImageButton} onClick={prevImage}>
                    <RxArrowLeft className={classes.switchImageIcon}/>
                </button>

                <button className={classes.switchImageButton} onClick={nextImage}>
                    <RxArrowRight className={classes.switchImageIcon}/>
                </button>
            </div>
        </div>
    );
}
