import get from 'lodash.get'
import PropTypes from 'prop-types'
import React from 'react'
import { TouchableOpacity, View, FlatList } from 'react-native'

function noop() {}

class TreeView extends React.Component {
  static propTypes = {
    data: PropTypes.array.isRequired,
    renderNode: PropTypes.func.isRequired,
    initialExpanded: PropTypes.bool,
    getCollapsedNodeHeight: PropTypes.func,
    idKey: PropTypes.string,
    childrenKey: PropTypes.string,
    onNodePress: PropTypes.func,
    onNodeLongPress: PropTypes.func,
    isNodeExpanded: PropTypes.func
  }

  static defaultProps = {
    initialExpanded: false,
    getCollapsedNodeHeight: () => 20,
    idKey: 'id',
    childrenKey: 'children',
    onNodePress: noop,
    onNodeLongPress: noop,
    isNodeExpanded: noop
  }

  constructor(props) {
    super(props)

    this.state = this.getInitialState()
  }

  getInitialState = () => ({
    expandedNodeKeys: {},
  })

  componentDidUpdate(prevProps) {
    const hasDataUpdated = prevProps.data !== this.props.data
    const hasIdKeyUpdated = prevProps.idKey !== this.props.idKey
    const childrenKeyUpdated = prevProps.childrenKey !== this.props.childrenKey

    if (hasDataUpdated || hasIdKeyUpdated || childrenKeyUpdated) {
      this.setState(this.getInitialState())
    }
  }

  hasChildrenNodes = (node) =>
    get(node, `${this.props.childrenKey}.length`, 0) > 0

  isExpanded = (id) => {
    if (this.props.isNodeExpanded !== noop) {
      return this.props.isNodeExpanded(id)
    } else {
        return get(this.state.expandedNodeKeys, id, this.props.initialExpanded)
    }
  }

  updateNodeKeyById = (id, expanded) => ({ expandedNodeKeys }) => ({
    expandedNodeKeys: Object.assign({}, expandedNodeKeys, {
      [id]: expanded,
    }),
  })

  collapseNode = (id) => this.setState(this.updateNodeKeyById(id, false))

  expandNode = (id) => this.setState(this.updateNodeKeyById(id, true))

  toggleCollapse = (id) => {
    const method = this.isExpanded(id) ? 'collapseNode' : 'expandNode'

    this[method](id)
  }

  handleNodePressed = async ({ item, level }) => {
    const nodePressResult = await this.props.onNodePress({ item, level })

    if (nodePressResult !== false && this.hasChildrenNodes(item)) {
      this.toggleCollapse(item[this.props.idKey])
    }
  }

  Tree = ({ nodes, level }) => {
    return (
      <FlatList
        scrollEnabled={false}
        extraData={this.props.extraData}
        style={{ backgroundColor: 'white' }}
        key={nodes[this.props.idKey]}
        keyExtractor={(item, index) => item.id.toString()}
        data={nodes}
        renderItem={({ item }) => {
          const isExpanded = this.isExpanded(item[this.props.idKey])
          const hasChildrenNodes = this.hasChildrenNodes(item)
          const shouldRenderLevel = hasChildrenNodes && isExpanded

          return (
            <View
              key={item[this.props.idKey]}
              style={{
                height: isExpanded
                  ? 'auto'
                  : this.props.getCollapsedNodeHeight({
                    [this.props.idKey]: item[this.props.idKey],
                    level,
                  }),
                zIndex: 1,
                overflow: 'hidden',
              }}
            >
              <TouchableOpacity
                onPress={() => this.handleNodePressed({ item, level })}
                onLongPress={() => this.props.onNodeLongPress({ item, level })}
              >
                {React.createElement(this.props.renderNode, {
                  item,
                  level,
                  isExpanded,
                  hasChildrenNodes,
                })}
              </TouchableOpacity>
              {shouldRenderLevel && (
                <this.Tree nodes={item[this.props.childrenKey]} level={level + 1} />
              )}
            </View>
          )
        }
        }
      />
    )
  }

  render() {
    return <this.Tree nodes={this.props.data} level={0} />
  }
}

export default TreeView