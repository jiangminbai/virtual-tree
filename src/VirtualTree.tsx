import React, { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react"
import arrowSvg from './assets/right-arrow.svg'
import './VirtualTress.scss'

export interface VirtualNode {
  id: string | number,
  label: string,
  children?: VirtualNode[]
}

interface DepthNode extends VirtualNode {
  depth: number,
  parent: DepthNode | null,
  children?: DepthNode[],
}

interface VirtualTreeProps {
  data: VirtualNode[],
  height?: number,
  rowHeight: number,
  expandKeys?: (number | string)[]
}

interface VirtualNodeProps {
  node: DepthNode,
  expandedKeys: (string | number)[],
  onClick: (e: React.MouseEvent) => void,
}

function transformData2Depth (data: VirtualNode[], depth = 0, parent: DepthNode | null) : DepthNode[] {
  return data.map(item => {
    const newItem = {
      ...item,
      depth,
      parent,
    } as DepthNode
    newItem.children = item.children ? transformData2Depth(item.children, depth + 1, newItem) : []
    return newItem
  })
}

function transformDepth2Map (data: DepthNode[]) {
  const map = new Map<string | number, DepthNode>()
  function recur (nodes: DepthNode[]) {
    for (let node of nodes) {
      map.set(node.id, node)
      if (node.children?.length) {
        recur(node.children)
      }
    }
  }
  recur(data)
  return map
}

function VirtualNode (props: VirtualNodeProps) {
  const {
    node,
    expandedKeys,
    onClick,
  } = props

  const isExpand = expandedKeys.includes(node.id)

  return (
    <div
      className="virtual-li"
      onClick={onClick}
    >
      <div className="virtual-li-container" style={{paddingLeft: node.depth * 16}}>
        {
          node?.children?.length ?
            <img
              style={{
                width: 16,
                height: 16,
                marginRight: 10,
                transition: 'transform 0.3s',
                verticalAlign: "center",
                transform: `rotate(${isExpand ? "90deg" : "0deg"})`
              }}
              src={arrowSvg}
            />
          : <div style={{width: 26}}></div>
        }
        {props.node.label}
      </div>
    </div>
  )
}
const DEFAULT_HEIGHT = 100
const ROW_HEIGHT = 48
export default function VirtualTree (props: VirtualTreeProps) {
  const {
    data,
    rowHeight = ROW_HEIGHT,
    height = DEFAULT_HEIGHT,
    expandKeys = []
  } = props
  const treeRef = useRef<HTMLDivElement>(null)
  // 视窗口高度
  const [virtualHeight, setVirtualHeight] = useState<number>(height)
  const [scrollTop, setScrollTop] = useState(0);
  const [expandedKeys, setExpandedKeys] = useState<(string | number)[]>([]);
  const [depthData, setDepthData] = useState<DepthNode[]>([]); // 列表数据

  const allHeight = useMemo(() => depthData.length * rowHeight, [depthData, rowHeight])
  const startIdx = useMemo(() => Math.floor(scrollTop / rowHeight), [scrollTop, rowHeight])
  const count = useMemo(() => Math.min(Math.ceil(virtualHeight / rowHeight), depthData.length), [rowHeight, virtualHeight, depthData])

  // 列表容器高度: 被设计出来处理边界问题(视窗口无法完整显示列表项目)
  const listHeight = useMemo(() => count * rowHeight, [count, rowHeight])
  // 可视化数据
  const virtualData = useMemo(() => {
    return depthData.slice(startIdx, startIdx + count)
  }, [depthData, startIdx, count])

  const handleScroll = useCallback<React.UIEventHandler<HTMLDivElement>>((e) => {
    const target = e.target as HTMLDivElement
    const top = target.scrollTop
    console.log(top)
      setScrollTop(top - top % rowHeight)
  }, [rowHeight])

  const handleItemClick = useCallback((e: React.MouseEvent, node: DepthNode, isExpand: boolean) => {
    setExpandedKeys(keys => {
      if (isExpand) {
        return keys.filter(key => key !== node.id)
      } else {
        return [...keys, node.id]
      }
    })
    if (node.children?.length) {
      if (!isExpand)  {
        setDepthData(dpdata => {
          const index = dpdata.findIndex(item => item.id === node.id)
          const prev = dpdata.slice(0, index + 1)
          const next = dpdata.slice(index + 1)
          return [...prev, ...(node?.children || []), ...next]
        })
      } else {
        setDepthData(dpdata => {
          const index = dpdata.findIndex(item => item.id === node.id)
          const prev = dpdata.slice(0, index + 1)
          const next = dpdata.slice(index + 1 + (node.children?.length || 0))
          return [...prev, ...next]
        })
      }
    }
  }, [])

  // useEffect(() => {
  //   setDepthData(transformData2Depth(data, 0, null))
  // }, [data])

  useEffect(() => {
    let dp = transformData2Depth(data, 0, null)
    let dpmap = transformDepth2Map(dp)
    const nodes: DepthNode[] = []
    let keys = []
    let i = 0;
    while (i < expandKeys.length) {
      const node = dpmap.get(expandKeys[i])
      let el: DepthNode | null | undefined = node
      while (el) {
        nodes.push(el)
        el = el.parent
      }
      i++
    }
    nodes
      .sort((a, b) => a.depth - b.depth)
    if (dp.length > 0) {
      for (let node of nodes) {
        const index = dp.findIndex(item => item.id === node.id)
        dp.splice(index + 1, 0, ...(node?.children || []))
      }
    }
    keys = nodes.map(item => item.id)
    console.log(nodes, dp)
    setExpandedKeys(keys)
    setDepthData(dp)
  }, [expandKeys, data])

  useLayoutEffect(() => {
    setVirtualHeight((treeRef.current as HTMLDivElement)?.clientHeight)
  }, [])

  return (
    <div
      className="virtual-tree"
      style={{height: '100%'}}
      onScroll={handleScroll}
      ref={treeRef}
    >
      <div className="virtual-scroll" style={{height: allHeight + 'px'}}>
        <div className="virtual-ul" style={{height: (listHeight) + 'px', transform: `translateY(${scrollTop}px)`}}>
          {
            virtualData.map((item: DepthNode, index: number) => {
              return (
                <VirtualNode
                  key={item.id}
                  node={item}
                  expandedKeys={expandedKeys}
                  onClick={(e) => handleItemClick(e, item, expandedKeys.includes(item.id))}
                ></VirtualNode>
              )
            })
          }
        </div>
      </div>
    </div>
  )
}