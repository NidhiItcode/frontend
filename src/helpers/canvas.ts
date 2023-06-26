export const dragBoundFunc = (stageWidth: number, stageHeight: number, rectWidth:number, rectHeight: number, pos: any) => {
    let x = pos.x;
    let y = pos.y;
    if (pos.x + rectWidth > stageWidth) x = stageWidth;
    if (pos.x - rectWidth < 0) x = 0;
    if (pos.y + rectHeight > stageHeight) y = stageHeight;
    if (pos.y - rectHeight < 0) y = 0;
    return { x, y };
  };
  export const minMax = (points: any) => {
    return points.reduce((acc: any, val: any) => {
      acc[0] = acc[0] === undefined || val < acc[0] ? val : acc[0];
      acc[1] = acc[1] === undefined || val > acc[1] ? val : acc[1];
      return acc;
    }, []);
  };

  export const closestPointIndex = (points: any, currPoint: any) => {
    let lowestIndex = 0;
    for(let i = 1;i<points.length;i++){
        let curr = points[i];
        if(isCloser(currPoint, curr, points[lowestIndex])){
            lowestIndex = i;
        }
    }
    console.log(lowestIndex);
    return lowestIndex;
  }

  //Returns whether point1 is closer to the base point than point2
  export const isCloser = (base: any, point1: number[], point2: number[]) => {
    return Math.pow(point1[0]-base[0],2)+Math.pow(point1[1]-base[1],2)<=Math.pow(point2[0]-base[0],2)+Math.pow(point2[1]-base[1],2);
  }