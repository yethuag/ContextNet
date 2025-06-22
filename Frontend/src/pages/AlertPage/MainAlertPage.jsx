import AlertPage from './AlertControllerPage'
import DailyTargetsChart from '../../components/Alert/DailyTargetChart'
import LinesAndGradientChart from '../../components/Alert/LinesAndGradientChart'

const MainAlertPage = () => {
  return (
    <div className="w-full max-w-7xl mx-auto p-4 space-y-6">
      <AlertPage />
      <div className="flex flex-col lg:flex-row gap-6">
        <div className="flex-1 min-w-0">
          <DailyTargetsChart />
        </div>
        <div className="flex-1 min-w-0">
          <LinesAndGradientChart />
        </div>
      </div>
    </div>
  )
}

export default MainAlertPage