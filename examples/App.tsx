import { useEffect, useState } from "react"
import VirtualTree, { VirtualNode } from "../src/VirtualTree"
import axios from 'axios'
import './App.scss'
import data from './mock/tree-data.json'

export default function App() {
  const [treeData, settreeData] = useState<VirtualNode[]>([])
  useEffect(() => {
    // axios
    //   .get('/tree-data.json', {responseType: 'json'})
    //   .then(res => {
        settreeData(data as VirtualNode[])
      // })
  }, [])
  return (
    <div className="virtual-container">
      <VirtualTree
        data={treeData}
        rowHeight={48}
        expandKeys={['3267dc99-d73c-465c-afea-d29190ee1ac6']}
      />
    </div>
  )
}
