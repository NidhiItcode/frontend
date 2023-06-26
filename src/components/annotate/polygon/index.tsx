import React, { useMemo, useRef, useState, useEffect } from 'react';
import PolygonAnnotation from './polygonAnnotation';
import { Stage, Layer, Image } from 'react-konva';
import { closestPointIndex, isCloser } from '@/helpers/canvas';
import Konva from 'konva';

const Canvas = (props: {videoSource: string}) =>{

    const [image, setImage] = useState<HTMLImageElement | null>(null);
    const imageRef = useRef<HTMLImageElement | null>(null);
    const dataRef = useRef(null);
    const [points, setPoints] = useState<any[]>([]);
    const [size, setSize] = useState<{width: number, height: number}>();
    const [flattenedPoints, setFlattenedPoints] = useState<number[][]>();
    const [position, setPosition] = useState<number[]>([0,0]);
    const [isMouseOverPoint, setIsMouseOverPoint] = useState<boolean>(false);
    const [isPolyComplete, setIsPolyComplete] = useState<boolean>(false);
    const [stageX, setStageX] = useState(0);
    const [stageY, setStageY] = useState(0);
    const [stageScale, setStageScale] = useState(1);

    const videoElement = useMemo(() =>{
        const element = new window.Image();
        element.width = 480;
        element.height = 360;
        element.src = props.videoSource;
        return element;
    }, [props.videoSource]);

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
        else setPoints([...points, mousePos]);
    }

    const handleMouseMove = (e: Konva.KonvaEventObject<DragEvent>) =>{
        const stage = e.target.getStage();
        const mousePos = getMousePos(stage!);
        setPosition(mousePos);
    }

    const handleMouseOverStartPoint = (e: Konva.KonvaEventObject<DragEvent>) =>{
        if(isPolyComplete || points.length<3) return;
        e.target.scale({x: 1.5, y: 1.5});
        setIsMouseOverPoint(true);
    }

    const handleMouseOutStartPoint = (e: Konva.KonvaEventObject<DragEvent>) =>{
        e.target.scale({x: 1, y: 1});
        setIsMouseOverPoint(false);
    }

    const handlePointDragMove = (e: Konva.KonvaEventObject<DragEvent>) =>{
        const stage = e.target.getStage();
        const oldScale = stage?.scaleX!();
        const index = e.target.index - 1;
        const pos = [(e.target._lastPos.x - stage!.x())/oldScale!, (e.target._lastPos.y - stage!.y())/oldScale!];
        if(pos[0] < 0) pos[0] = 0;
        if(pos[1] < 0) pos[1] = 0;
        if(pos[0] > stage!.width()) pos[0] = stage!.width();
        if(pos[1] > stage!.height()) pos[1] = stage!.height();
        setPoints([...points.slice(0, index), pos, ...points.slice(index+1)]);
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

    const handleGroupDragEnd = (e: Konva.KonvaEventObject<DragEvent>) =>{
        if(e.target.name() === 'polygon'){
            let result: any[] = [];
            let copyPoints = [...points];
            copyPoints.map((point) => result.push([point[0] + e.target.x(), point[1] + e.target.y()]));
            e.target.position({x: 0, y: 0});
            setPoints(result);
        }
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
                        flattenedPoints={flattenedPoints}
                        handlePointDragMove={handlePointDragMove}
                        handleGroupDragEnd={handleGroupDragEnd}
                        handleMouseOverStartPoint={handleMouseOverStartPoint}
                        handleMouseOutStartPoint={handleMouseOutStartPoint}
                        isFinished={isPolyComplete}
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