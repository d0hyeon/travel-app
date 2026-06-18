// import { useEffect, useId, useMemo, type ReactElement } from "react";
// import { Link, useNavigate, useSearchParams, type LinkProps } from "react-router";
// import { queryParams } from '~shared/utils/urls';
// import { useQueryParam } from "../urls/useQueryParam";
// import { useOverlay } from "../useOverlay";
// import { usePreservedCallback } from "./usePreservedCallback";

// interface RenderProps<State = never> {
//   state: State;
//   isOpen: boolean;
//   close: () => void;
// }

// interface Props<Data = never> {
//   onEnter: (data: Data) => ReactElement;
// }

// export function useRouteOverlay<Data = never>({ onEnter }: Props<Data>) {
//   const id = useId();
//   const routeOverlayIds = useQueryParam('route-overlay-ids', {
//     defaultValue: [],
//     parse: value => value ? value.split(',') : [],
//   })
//   const renderParam = useQueryParam<Data>('route-overlay-param', {
//     parse: value => value ? JSON.parse(value) : value
//   });
//   const isOpen = routeOverlayIds.includes(id);
//   const overlay = useOverlay();

//   const renderElement = usePreservedCallback(onEnter);
//   useEffect(() => {
//     if (routeOverlayIds.includes(id)) {
//       overlay.open(() => renderElement(renderParam!))

//       return () => overlay.close()
//     }
//   }, [isOpen])

//   const navigate = useNavigate();
//   const [searchParams] = useSearchParams();

//   return useMemo(() => {
//     const createSearch = (data: Data) => queryParams.serialize({
//       ...Object.fromEntries(searchParams.entries()),
//       'route-overlay-ids': [...routeOverlayIds, id].join(','),
//       'route-overlay-param': JSON.stringify(data)
//     })

//     return {
//       isOpen,
//       navigate: (to: string, data: Data) => {
//         navigate({ search: createSearch(data) }, { mask: to })
//       },
//       Link: (props: Omit<LinkProps, 'mask'> & { data: Data }) => (
//         <Link {...props} mask={props.to} to={createSearch(props.data)} />
//       )
//     }
//   }, [isOpen, searchParams, routeOverlayIds.join()])
// }



import { useEffect, useId, useMemo, type ReactNode } from "react";
import { Link, useLocation, useNavigate, type LinkProps } from "react-router";
import { queryParams } from '~shared/utils/urls';
import { useOverlay, type OverlayRenderProps as OverlayProps } from "../useOverlay";
import { usePreservedCallback } from "./usePreservedCallback";

export interface OverlayRouteRenderProps<State = never> extends OverlayProps {
  state: State;
}

interface Props<State = never> {
  path?: string | ((state: State) => string);
  component: (props: OverlayRouteRenderProps<State>) => ReactNode;
}

export function useOverlayRoute<State = never>({ component }: Props<State>) {
  const id = useId()
  const { state: _state, pathname, search: _search } = useLocation();
  const { routeOverlayIds = [], state } = _state ?? {};

  const isOpen = routeOverlayIds.includes(id);
  const overlay = useOverlay();

  const renderElement = usePreservedCallback(component);
  useEffect(() => {
    if (routeOverlayIds.includes(id)) {
      overlay.open((props) => renderElement({ ...props, state }))
      return () => overlay.close()
    }
  }, [isOpen]);

  const navigate = useNavigate();
  const search = queryParams.parse(_search);

  return useMemo(() => {
    const nextRouteOverlayIds = [...routeOverlayIds, id];

    return {
      isOpen,
      back: () => navigate(-1),
      navigate: (to: string, state: State) => {
        return navigate(
          { pathname, search: queryParams.serialize({ ...search, overlayRoute: true }) },
          { mask: to, state: { state, routeOverlayIds: nextRouteOverlayIds } }
        )
      },
      Link: (props: Omit<LinkProps, 'mask' | 'state'> & { state: State }) => (
        <Link
          {...props}
          mask={props.to}
          to={{ pathname, search: queryParams.serialize({ ...search, overlayRoute: true }) }}
          state={{ state: props.state, routeOverlayIds: nextRouteOverlayIds }}
        />
      )
    }
  }, [isOpen, routeOverlayIds.join()])
}