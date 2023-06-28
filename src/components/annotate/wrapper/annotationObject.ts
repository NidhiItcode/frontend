import api from '@/helpers/api';
import { delay } from '@/helpers/timers';

/**
 * This class is a wrapper that adds, edits, and delete annotation boxes and synchronizes with the server.
 */
export default class AnnotationObject {
    // This server ID is the corresponding ID of the annotation box in the database.
    // However, since this is not available in the request, when editing.
    serverId?: string | null = null;
    // When the user edits a newly added box, before the ID can be received, the system needs to poll
    // the serverID, otherwise we don't know which box ID to edit.
    // However, we will need to check if the polling function has already started.
    pollQueued: boolean = false;

    label: Flockfysh.Label | null = null;
    frame: number = 0;
    boundingBox: AnnotationBox = {
        height: 0.5,
        width: 0.5,
        x: 0.5,
        y: 0.5,
    };
    points: Flockfysh.Point[] = [];

    deleted: boolean = false;

    async pollInner() {
        while (!this.serverId) await delay(1);
    }

    async editInner() {
        if (!this.serverId) throw new Error('This internal function cannot be called without having a server ID.');
        
        const { width, height, x, y } = this.boundingBox;
        const temp: any = this.points.map((point: Flockfysh.Point) =>{
            return [point.x, point.y];
        });
        await api.put(`/api/annotations/${this.serverId}`, {
            label: this.label?._id,
            frame: this.frame,
            data: {points: temp}
        });
    }

    async deleteInner() {
        if (this.deleted) throw new Error('This image has already been deleted.');
        if (!this.serverId) throw new Error('This internal function cannot be called without having a server ID.');
        
        await api.delete(`/api/annotations/${this.serverId}`);
    }

    /**
     *
     * @param label The label of the box.
     * @param frame The video frame of the asset(0 for image)
     * @param serverId The ID from the server.
     * Lets the object tell which box it is when synchronizing with the server.
     * If the box is newly created, leave this empty.
     * @param boundingBox Annotation box data from the server.
     */
    constructor(label: Flockfysh.Label, frame: number, serverId?: string, points?: Flockfysh.Point[]) {
        this.label = label;
        this.frame = frame;
        this.serverId = serverId;
        if (points) this.points = points;
    }

    /**
     *
     * @param imageId Which image this new box belongs to.
     * @throws If the server cannot give an ID to the new bounding box.
     * Also throws if the box already belongs to another image.
     */
    async saveTo(imageId: string) {
        if (this.serverId) throw new Error('This annotation box has already been created server-side.');
        
        const { width, height, x, y } = this.boundingBox;
        const temp = this.points.map((point: Flockfysh.Point) =>{
            return [point.x, point.y];
        })
        const response = await api.post(`/api/assets/${imageId}/annotations`, {
            label: this.label?._id,
            frame: this.frame,
            data: {points: temp},
            assetId: imageId
        });

        const newRemoteAnnotationData = response.data.data;
        
        if (!newRemoteAnnotationData.id) throw new Error('Annotation response from server is malformed.');
        
        this.serverId = newRemoteAnnotationData.id;
    }

    /**
     * Attempts to make a PUT request to edit the annotation box coordinates on the server.
     * If the annotation box does not have an ID from the server yet, the code will poll
     * and wait until the box gets a server ID.
     *
     * @param newData The new coordinates and dimensions of the box.
     */
    async edit(newData: Flockfysh.Point[]): Promise<void> {
        this.points = newData;

        if (!this.serverId) {
            if (!this.pollQueued) {
                this.pollQueued = true;
             
                await this.pollInner();
            }
            else return;
        }

        await this.editInner();
    }

    /**
     * Attempts to make a DELETE request to remove the annotation box from the server.
     * If the annotation box does not have an ID from the server yet, it will poll
     * and wait until there is a server ID instead.
     *
     */
    async delete(): Promise<void> {
        if (!this.serverId) {
            if (!this.pollQueued) {
                this.pollQueued = true;
                await this.pollInner();
            }
            else return;
        }
        
        await this.deleteInner();
    }
}