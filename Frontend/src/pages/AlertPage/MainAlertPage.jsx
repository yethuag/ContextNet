import AlertPage from './AlertControllerPage'
import DailyTargetsChart from '../../components/Alert/DailyTargetChart'
import LinesAndGradientChart from '../../components/Alert/LinesAndGradientChart'
const MainAlertPage = () => {
  return (
    <>
      <AlertPage/>
    <div className='flex'>
      <div className='flex-1'>
      <DailyTargetsChart />
      </div>
      <div className='flex-1'>
      <LinesAndGradientChart/>
      </div>
    </div>
    </>
  )
}

export default MainAlertPage