import {
    Chart as ChartJS,
    LinearScale,
    CategoryScale,
    BarElement,
    PointElement,
    LineElement,
    Legend,
    Tooltip,
    LineController,
    BarController,
    ScriptableContext
} from 'chart.js';

import { Chart } from 'react-chartjs-2';

import ActivityCard from './activityCard';

import classes from './styles.module.css';

ChartJS.register(
    LinearScale,
    CategoryScale,
    BarElement,
    PointElement,
    LineElement,
    Legend,
    Tooltip,
    LineController,
    BarController
);

export default function ActivityGraph() {
    const labels = new Array(24).fill(2).map((_, i) => i + 1);

    const data = function () {
        return {
            labels,
            datasets: [
                {
                    yAxesId: 'y',
                    type: 'line' as const,
                    label: 'Num Datasets',
                    borderWidth: 2,
                    fill: false,
                    data: labels.map(() => Math.random() * 1000),
                    borderColor: (context: ScriptableContext<'line'>) => {
                        const chart = context.chart;
                        const { ctx, chartArea } = chart;

                        // This case happens on initial chart load
                        if (!chartArea) return;

                        const gradient = ctx.createLinearGradient(
                            0,
                            0,
                            chartArea.bottom,
                            chartArea.top
                        );

                        gradient.addColorStop(0, '#2BCDE4');
                        gradient.addColorStop(1, '#5D32E9');

                        return gradient;
                    },
                },
                {
                    yAxesId: 'y1',
                    type: 'bar' as const,
                    label: 'Num Files',
                    backgroundColor: 'white',
                    borderColor: 'white',
                    data: labels.map(() => Math.random() * 1000),
                    barThickness: 5,
                    borderWidth: 0,
                    borderRadius: 10,
                },
            ],
        };
    };

    const options = {
        responsive: true,
        interaction: {
            mode: 'index' as const,
            intersect: false,
        },
        stacked: false,
        plugins: {
            title: {
                display: true,
            },
            tooltip: {
                backgroundColor: '#1E1E1E',
                titleColor: '#D2E1FF',
                titleFont: {
                    weight: '700',
                    size: 16,
                },
                titleAlign: 'center' as const,
                bodyColor: '#D2E1FF',
                bodyAlign: 'center' as const,
                displayColors: false,
                caretSize: 0,
                borderColor: '#222327',
                borderWidth: 1,
                positions: 'nearest' as const,
            },
        },
        scales: {
            yAxes: {
                grid: {
                    drawBorder: true,
                    color: '#FFFFFF',
                },
                ticks: {
                    display: false,
                    color: '#D2E1FF',
                },
            },
            y: {
                type: 'linear' as const,
                display: true,
                position: 'left' as const,
                title: {
                    display: true,
                    text: 'Number of Files',
                    color: '#D2E1FF',
                    font: {
                        size: 12,
                    },
                },
            },
            y1: {
                type: 'linear' as const,
                display: true,
                position: 'right' as const,
                grid: {
                    drawOnChartArea: false,
                },
                title: {
                    display: true,
                    text: 'Number of Datasets',
                    color: '#D2E1FF',
                    font: {
                        size: 12,
                    },
                },
            },
        },
        maintainAspectRatio: false,
    };

    const activity = [
        {
            dateAdded: new Date(),
            activityDesc: 'Added 10 images to XYZ dataset totalling 25 GB',
        },
        {
            dateAdded: new Date(),
            activityDesc: 'Added 10 images to XYZ dataset totalling 25 GB',
        },
        {
            dateAdded: new Date(),
            activityDesc: 'Added 10 images to XYZ dataset totalling 25 GB',
        },
        {
            dateAdded: new Date(),
            activityDesc: 'Added 10 images to XYZ dataset totalling 25 GB',
        },
    ];

    return (
        <div className={ classes.container }>
            <div className={ classes.headerContainer }>
                <div className={ classes.topHeaderContainer }>
                    <h1 className={ classes.header }>Latest Activity</h1>

                    <div></div>
                </div>

                <div className={ classes.headerContent }>
                    <div className={ classes.activityTimeline }>
                        {
                            activity.map((activity, i) => (
                                <ActivityCard
                                    key={ i }
                                    dateAdded={ activity.dateAdded }
                                    activityDesc={ activity.activityDesc }
                                />
                            ))
                        }
                    </div>

                    <div className={ classes.chartContainer }>
                        <Chart
                            className={ classes.chart }
                            options={ options }
                            type="bar"
                            data={ data() }
                        />
                    </div>
                </div>
            </div>

            <div className={ classes.history }>
                <h1 className={ classes.header }>Activity History</h1>

                <div className={ classes.activityTableContainer }></div>
            </div>
        </div>
    );
}
