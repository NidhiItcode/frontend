import React, { useMemo, useRef, useState, useEffect, useContext } from 'react';
import PolygonAnnotation from './polygonAnnotation';
import { Stage, Layer, Image } from 'react-konva';
import { closestPointIndex, isCloser } from '@/helpers/canvas';
import Konva from 'konva';
import { AnnotationPageContext } from '@/contexts/annotationContext';

const Canvas = (props: {videoSource: string}) =>{
    const {
        curImage,
        isEditing,
        addAnnotationObject,
        curAnnotationData,
        curLabel,
        curBox,
        setCurBox,
        refresh,
    } = useContext(AnnotationPageContext);

    const [image, setImage] = useState<HTMLImageElement | null>(null);
    const imageRef = useRef<HTMLImageElement | null>(null);
    const dataRef = useRef(null);
    const [points, setPoints] = useState<any[]>([]);
    const [size, setSize] = useState<{width: number, height: number}>();
    const [flattenedPoints, setFlattenedPoints] = useState<number[][]>();
    const [position, setPosition] = useState<number[]>([0,0]);
    const [isPolyComplete, setIsPolyComplete] = useState<boolean>(false);
    const [stageX, setStageX] = useState(0);
    const [stageY, setStageY] = useState(0);
    const [stageScale, setStageScale] = useState(1);
    const [isMouseOverPoint, setIsMouseOverPoint] = useState<boolean>(false);
    const videoElement = useMemo(() =>{
        const element = new window.Image();
        element.width = 480;
        element.height = 360;
        element.src = props.videoSource;
        return element;
    }, [props.videoSource]);
    const [wrapperDimension, setWrapperDimension] = useState<{ width: number, height: number }>({
        width: 0,
        height: 0,
    });
    const [rectangles, setRectangles] = useState<JSX.Element[]>([]);
    const annotationImageRef = useRef<HTMLImageElement | null>(null);
    
        useEffect(() => {
            if (annotationImageRef.current) {
                const imageElem = annotationImageRef.current;
    
                const updateWrapperSize= function(): void {
                    setWrapperDimension({
                        width: Math.ceil(imageElem.width),
                        height: Math.ceil(imageElem.height),
                    });
                }
    
                updateWrapperSize();
                imageElem.addEventListener('load', updateWrapperSize);
                window.addEventListener('resize', updateWrapperSize);
    
                return () => {
                    imageElem.removeEventListener('load', updateWrapperSize);
                    window.removeEventListener('resize', updateWrapperSize);
                };
            }
        }, []);
        useEffect(() => {
            const temp = [];
            for (const [id, annotationObject] of curAnnotationData.entries()) {
                if (annotationObject.label && curLabel && annotationObject.label._id === curLabel._id) {
                    temp.push((
                        // <Rectangle
                        //     key={ id }
                        //     shapeProps={ {
                        //         ...annotationObject.boundingBox,
                        //         stroke: curLabel ? curLabel.color : LABEL_COLORS[2],
                        //         opacity: isEditing ? 1 : 0.5,
                        //     } }
                        //     onSelect={ () => {
                        //         setCurBox(id);
                        //     } }
                        //     onDeselect={ () => {
                        //         setCurBox('');
                        //     } }
                        //     isSelected={ id === curBox }
                        //     containerWidth={ wrapperDimension.width }
                        //     containerHeight={ wrapperDimension.height }
                        //     onChange={
                        //         function save(box) {
                        //             annotationObject.edit(box);
                        //             refresh();
                        //         }
                        //     }
                        //     onDelete={
                        //         function deleteBox() {
                        //             annotationObject.delete();
                        //             curAnnotationData.delete(id);
                        //             refresh();
                        //             setCurBox('');
                        //         }
                        //     }
                        // />
                        <PolygonAnnotation
                            key={id}
                            points={points}
                            setPoints={setPoints}
                            flattenedPoints={flattenedPoints}
                            isFinished={isPolyComplete}
                            onChange={
                                function save(points: any[]){
                                    annotationObject.edit(points);
                                    refresh();
                                }
                            }
                            isMouseOverPoint={isMouseOverPoint}
                            setIsMouseOverPoint={setIsMouseOverPoint}
                        />
                    ));
                }
            }
            console.log(temp);
            console.log(curAnnotationData);
            setRectangles(temp);
        }, [curLabel])
    useEffect(() =>{
        const onload = function(){
            setSize({
                width: videoElement.width,
                height: videoElement.height
            })
            setImage(videoElement);
            imageRef.current = videoElement;
        }
        videoElement.addEventListener('load', onload);
        return () =>{
            videoElement.removeEventListener('load', onload);
        }
    }, [videoElement])

    const dragBoundFunc = (newPos: {x: number, y: number}) =>{
        //console.log(newPos)
        //console.log(imageRef.current.height+newPos.y);
        let x = newPos.x;
        let y = newPos.y;
        if(x>0) x = 0;
        if(y>0) y = 0;
        if(imageRef.current){
            if(imageRef.current.height*stageScale + newPos.y < imageRef.current.height){
                y = imageRef.current.height-imageRef.current.height*stageScale;
            }
            if(imageRef.current.width*stageScale + newPos.x < imageRef.current.width){
                x = imageRef.current.width-imageRef.current.width*stageScale;
            }
            return {x: x, y: y};
        }
        //const stage = e.target.getStage();
        //return {x: stage.x(), y: stage.y()};
        
        //console.log(imageRef.current.height*stageScale + newPos.y);
        //console.log(stageScale);
    }
    const getMousePos = (stage: Konva.Stage) =>{
        const oldScale = stage.scaleX();
        const mousePointTo = [
            stage?.getPointerPosition()!.x / oldScale - stage.x() / oldScale,
            stage?.getPointerPosition()!.y / oldScale - stage.y() / oldScale
        ];
        return mousePointTo;
    }

    const handleMouseDown = (e: Konva.KonvaEventObject<DragEvent>) =>{
        if(isPolyComplete) return;
        const stage = e.target.getStage();
        const mousePos = getMousePos(stage!);
        if(isMouseOverPoint && points.length >=3){
            setIsPolyComplete(true);
            handleMouseOutStartPoint(e);
        }
        setPoints([...points, mousePos]);
    }
    const handleMouseOutStartPoint = (e: Konva.KonvaEventObject<DragEvent>) =>{
        e.target.scale({x: 1, y: 1});
        setIsMouseOverPoint(false);
    }

    const handleMouseMove = (e: Konva.KonvaEventObject<DragEvent>) =>{
        const stage = e.target.getStage();
        const mousePos = getMousePos(stage!);
        setPosition(mousePos);
    }

    const handleDoubleClick = (e: Konva.KonvaEventObject<DragEvent>) =>{
        if(isPolyComplete){
            let coord = getMousePos(e.target.getStage()!);
            let index = closestPointIndex(points, coord);
            if(index==0){
                if(isCloser(coord, points[points.length-1], points[1])){
                    points.push(coord);
                }
                else points.splice(1,0,coord);
            }
            else if(isCloser(coord, points[(index+1)%points.length], points[index-1])){
                points.splice(index+1, 0, coord);
            }
            else points.splice(index, 0, coord);
            setPoints([...points]);
        }

    }

    useEffect(() =>{
        setFlattenedPoints(
            points.concat(isPolyComplete ? [] : position).reduce((a,b) => a.concat(b), [])
        )
    }, [points])

    const undo = () =>{
        setPoints(points.slice(0, -1));
        setIsPolyComplete(false);
    }

    const handleScroll = (e: any) =>{
        e.evt.preventDefault();
        const stage = e.target.getStage();
        if(stage){
            const oldScale = stage.scaleX();
            const scaleBy = 1.05;
            const {x: pointerX, y: pointerY } = stage.getPointerPosition();
            const mousePointTo = {
                x: (pointerX-stage.x()) / oldScale,
                y: (pointerY-stage.y()) / oldScale
            }
            const newScale = e.evt.deltaY > 0 ? oldScale * scaleBy : oldScale / 1.05;
            if(newScale>20 || newScale<0.05) return;
            stage.scale({ x: newScale, y: newScale});
            const newPos = {
                x: pointerX - mousePointTo.x * newScale,
                y: pointerY - mousePointTo.y * newScale
            }
            stage.position(newPos)
        }
    }

    const showCoordinates = () =>{
        if(isPolyComplete) dataRef.current.style.display = "";
    }

    if(!size){
        return <></>
    }
    
    return (
        <div
            style={{
                display: 'flex',
                justifyContent: 'center',
                flexDirection: 'column',
                alignItems: 'center'
            }}
        >
            <Stage
                width={size!.width || 480}
                height={size!.height || 480}
                onMouseMove={handleMouseMove}
                onMouseDown={handleMouseDown}
                onDblClick={handleDoubleClick}
                onWheel={handleScroll}
                onContextMenu={() => console.log("HI")}
                x={stageX}
                y={stageY}
                scaleX={stageScale}
                scaleY={stageScale}
                draggable
            >
                <Layer>
                    <Image ref={imageRef} image={image} x={0} y={0} width={size!.width} height={size!.height}/>
                    <PolygonAnnotation
                        points={points}
                        setPoints={setPoints}
                        flattenedPoints={flattenedPoints}
                        isFinished={isPolyComplete}
                        onChange={
                            () => {;}
                        }
                        isMouseOverPoint={isMouseOverPoint}
                        setIsMouseOverPoint={setIsMouseOverPoint}
                    />
                </Layer>
            </Stage>
            <div
                ref={dataRef}
                style={{display: 'none', width: 400, boxShadow: '7px 7px 5px .4em rgba(0,0,0,.1)'}}
            >
                HI
                <pre>{}</pre>
            </div>
        </div>
    )
}

export default Canvas;