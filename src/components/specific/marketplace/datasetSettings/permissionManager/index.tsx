import { getDefaultProfilePicture } from '@/helpers/defaults';
import Image from 'next/image';
import Select, { AsyncCustomSelect, CustomCreatableSelect } from '@/components/ui/input/select';
import classes from './styles.module.css';
import { useStateWithDeps } from 'use-state-with-deps';
import InfiniteScroll from 'react-infinite-scroller';
import deleteIcon from '@/icons/main/trash.svg';
import { ReactSVG } from 'react-svg';
import plus from '@/icons/main/plus-circle.svg';
import ActionPopupWithButton from '@/components/ui/modals/actionPopupWithButton';
import PermissionForm from '@/components/specific/marketplace/datasetSettings/permissionManager/permissionForm';
import { permissionOptions } from '@/helpers/enums/permission';
import useClient from '@/helpers/hooks/useClient';
import api from '@/helpers/api';
import { ApiError } from '@/helpers/errors';


function PermissionModal(props: {
    dataset: PreviewDataset
    onInsert: (data: PermissionWithUser) => void
}) {
    return (
        <ActionPopupWithButton button={ (
            <button className={ classes.inviteButton }>
                Invite
                <ReactSVG src={ plus.src }></ReactSVG>
            </button>
        ) } popupTitle={ 'Add permissions' } variant={ 'marketplace' }>
            <PermissionForm dataset={ props.dataset } onInsert={ props.onInsert }></PermissionForm>
        </ActionPopupWithButton>
    );
}


function PermissionCard(props: {
    permission: PermissionWithUser,
    onDelete: () => void,
}) {
    const body = useClient(() => document.body);

    return (
        <li className={ classes.card }>
            <div className={ classes.cardBasicInfo }>
                <Image
                    width={ 48 }
                    height={ 48 }
                    src={ props.permission.user.profilePhoto?.url ?? getDefaultProfilePicture() }
                    alt={ 'Profile picture' }
                    className={ classes.cardProfilePicture }
                />
                <span className={ classes.email }>
                    { props.permission.user.email }
                </span>
                <Select
                    options={ permissionOptions } isMulti={ false }
                    className={ classes.selectInput }
                    classNames={ {
                        menu() {
                            return classes.selectMenu;
                        },
                    } }
                    onChange={ data => {
                    } }
                    menuPortalTarget={ body }
                    menuPosition={ 'fixed' }
                    defaultValue={ permissionOptions.filter(opt => opt.value === props.permission.role)[0] }
                />
            </div>
            <button onClick={ async () => {
                try {
                    await api.delete(`/api/datasetPermissions/${props.permission._id}`);
                }
 catch (e) {
                    if (e instanceof ApiError && e.code === 'ERROR_NOT_FOUND') {
                    }
                    else {
                        throw e;
                    }
                }
                props.onDelete();
            } } className={ classes.deleteButton }>
                <ReactSVG src={ deleteIcon.src } className={ classes.deleteButtonIcon }></ReactSVG>
            </button>
        </li>
    );
}

export default function PermissionManager(dataset: PreviewDataset) {
    const [state, setState] = useStateWithDeps<{
        hasMore: boolean,
        next?: string,
        permissions: Map<string, PermissionWithUser>
    }>(initialState, [dataset._id]);

    function initialState() {
        return {
            hasMore: true,
            next: undefined,
            permissions: new Map(),
        };
    }

    async function load() {
        const result = (await api.get<Api.PaginatedResponse<PermissionWithUser[]>>(`/api/datasets/${dataset._id}/permissions`, {
            params: {
                next: state.next,
                expand: 'user',
            },
        })).data;
        setState((prevState) => {
            for (const item of result.data) {
                prevState.permissions.set(item._id, item);
            }
            return {
                ...prevState,
                next: result.meta.next,
                hasMore: result.meta.hasNext,
            };
        });
    }

    return (
        <div className={ classes.container }>
            <div className={ classes.header }>
                <h3 className={ classes.heading }>
                    People who have access
                </h3>
                <PermissionModal dataset={ dataset } onInsert={ (perm) => {
                    state.permissions.set(perm._id, perm);
                    setState(prevState => ({ ...prevState }));
                } }></PermissionModal>
            </div>
            <div className={ classes.permissionListContainer }>
                <InfiniteScroll hasMore={ state.hasMore } loadMore={ () => {
                    load();
                } }>
                    <ul className={ classes.permissionList }>
                        { [...state.permissions.entries()].map(([key, perm]) => (
                            <PermissionCard
                                key={ key }
                                onDelete={ () => {
                                    state.permissions.delete(key);
                                    setState(prevState => ({ ...prevState }));
                                } }
                                permission={ perm }
                            />
                        )) }
                    </ul>
                </InfiniteScroll>
            </div>
        </div>
    );
}
