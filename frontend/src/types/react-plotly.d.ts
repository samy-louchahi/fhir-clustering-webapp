declare module 'react-plotly.js' {
  import { Component } from 'react';
  import { PlotParams } from 'plotly.js';

  export interface PlotProps extends Partial<PlotParams> {
    data: Partial<PlotParams['data']>;
    layout?: Partial<PlotParams['layout']>;
    config?: Partial<PlotParams['config']>;
    frames?: Partial<PlotParams['frames']>;
    style?: React.CSSProperties;
    className?: string;
    useResizeHandler?: boolean;
    onInitialized?: (figure: Readonly<PlotParams>, graphDiv: Readonly<HTMLElement>) => void;
    onUpdate?: (figure: Readonly<PlotParams>, graphDiv: Readonly<HTMLElement>) => void;
    onPurge?: (figure: Readonly<PlotParams>, graphDiv: Readonly<HTMLElement>) => void;
    onError?: (err: Readonly<Error>) => void;
    divId?: string;
    revision?: number;
    onClickAnnotation?: (event: Readonly<any>) => void;
    onLegendClick?: (event: Readonly<any>) => boolean;
    onLegendDoubleClick?: (event: Readonly<any>) => boolean;
    onHover?: (event: Readonly<any>) => void;
    onUnhover?: (event: Readonly<any>) => void;
    onSelected?: (event: Readonly<any>) => void;
    onSelecting?: (event: Readonly<any>) => void;
    onRestyle?: (event: Readonly<any>) => void;
    onRelayout?: (event: Readonly<any>) => void;
    onAutoSize?: (event: Readonly<any>) => void;
    onDeselect?: (event: Readonly<any>) => void;
    onDoubleClick?: (event: Readonly<any>) => void;
    onRedraw?: () => void;
    onAnimated?: () => void;
    onClick?: (event: Readonly<any>) => void;
    onAnimatingFrame?: (event: Readonly<any>) => void;
    onAnimationInterrupted?: () => void;
    onTransitioning?: () => void;
    onTransitionInterrupted?: () => void;
    onSliderChange?: (event: Readonly<any>) => void;
    onSliderEnd?: (event: Readonly<any>) => void;
    onSliderStart?: (event: Readonly<any>) => void;
    onButtonClicked?: (event: Readonly<any>) => void;
    onSunburstClick?: (event: Readonly<any>) => void;
    onWebGlContextLost?: () => void;
  }

  export default class Plot extends Component<PlotProps> {}
}
