import React, { useContext, useState } from 'react';
import { Line, Circle, Group, Rect } from 'react-konva';
import { minMax, dragBoundFunc } from '@/helpers/canvas';
import Konva from 'konva';
import { AnnotationPageContext } from '@/contexts/annotationContext';

const PolygonAnnotation = (props: any) =>{
    const {
        curImage,
        isEditing,
        addAnnotationObject,
        curAnnotationData,
        curLabel,
        curPolygon,
        setCurPolygon,
        refresh,
    } = useContext(AnnotationPageContext);

    const {
        points,
        flattenedPoints,
        isFinished,
        onChange,
        isMouseOverPoint,
        setIsMouseOverPoint,
    } = props;
    const rectWidth = 10;
    const rectHeight = 10;
    const [stage, setStage] = useState<any>();
    const [minMaxX, setMinMaxX] = useState([0,0]);
    const [minMaxY, setMinMaxY] = useState([0,0]);

    const pointDragBoundFunc = (pos: any) =>{
        if(!stage) return pos;
        let x = pos.x;
        let y = pos.y;
        let tempX = (pos.x-stage.x())/stage.scaleX();
        let tempY = (pos.y - stage.y())/stage.scaleY();
        if (tempX + rectWidth > stage.width()) x = stage.width()*stage.scaleX()+stage.x();
        if (tempX - rectWidth < 0) x = stage.x();
        if (tempY + rectHeight > stage.height()) y = stage.height()*stage.scaleY()+stage.y();
        if (tempY - rectHeight < 0) y = stage.y();
        return { x, y };
    }

    const handleGroupMouseOver = (e: Konva.KonvaEventObject<DragEvent>) =>{
        console.log(isFinished);
        console.log(isEditing);
        if(!isFinished || !isEditing) return;
        e.target.getStage()!.container().style.cursor = 'move';
        setStage(e.target.getStage());
    }

    const handleGroupMouseOut = (e: Konva.KonvaEventObject<DragEvent>) =>{
        e.target.getStage()!.container().style.cursor = 'default';
    }

    const handleGroupDragStart = (e: Konva.KonvaEventObject<DragEvent>) =>{
        let arrX = points.map((p: number[]) => p[0]);
        let arrY = points.map((p: number[]) => p[1]);
        setMinMaxX(minMax(arrX));
        setMinMaxY(minMax(arrY));
    }

    const groupDragBound = (pos: {x: number, y: number}) =>{
        let { x, y } = pos;
        const sw = stage.width();
        const sh = stage.height();
        if(minMaxY[0] + y < 0) y = -1 * minMaxY[0];
        if(minMaxX[0] + x < 0) x = -1 * minMaxX[0];
        if(minMaxY[1] + y > sh) y = sh - minMaxY[1];
        if(minMaxX[1] + x > sw) x = sw - minMaxX[1];
        return { x, y };
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
        onChange([...points.slice(0, index), pos, ...points.slice(index+1)]);
    }
    
    const handleGroupDragEnd = (e: Konva.KonvaEventObject<DragEvent>) =>{
        if(e.target.name() === 'polygon'){
            let result: any[] = [];
            let copyPoints = [...points];
            copyPoints.map((point) => result.push([point[0] + e.target.x(), point[1] + e.target.y()]));
            e.target.position({x: 0, y: 0});
            onChange(result);
        }
    }
    const handleMouseOverStartPoint = (e: Konva.KonvaEventObject<DragEvent>) =>{
        if(isFinished || points.length<3 || isEditing) return;
        e.target.scale({x: 1.5, y: 1.5});
        setIsMouseOverPoint(true);
    }
    const handleMouseOutStartPoint = (e: Konva.KonvaEventObject<DragEvent>) =>{
        e.target.scale({x: 1, y: 1});
        setIsMouseOverPoint(false);
    }

    return (
        <Group
            draggable={ isFinished && isEditing }
            onDragStart = { handleGroupDragStart }
            onDragEnd = { handleGroupDragEnd }
            dragBoundFunc = { groupDragBound }
            onMouseOver = { handleGroupMouseOver }
            onMouseOut = { handleGroupMouseOut }
        >
            <Line
                points={flattenedPoints}
                stroke="blue"
                strokeWidth={3}
                closed={isFinished}
                fill="rgb(0,128,0,0.5)"
            />
            {points.map((point: number[], index: number) =>{
                const x = point[0] - rectWidth / 2;
                const y = point[1] - rectHeight / 2;
                const startPointAttr = 
                    index === 0
                    ? {
                        hitStrokeWidth: 12,
                        onMouseOver: handleMouseOverStartPoint,
                        onMouseOut: handleMouseOutStartPoint,
                    }
                    : null
                return (
                    <Rect
                        key={index}
                        x={x}
                        y={y}
                        width={rectWidth}
                        height={rectHeight}
                        fill="white"
                        stroke="black"
                        strokeWidth={2}
                        draggable
                        onDragMove={handlePointDragMove}
                        dragBoundFunc={pointDragBoundFunc}
                        {...startPointAttr}
                    />
                )
            })}
        </Group>
    )

}

export default PolygonAnnotation;