import hashObjectGenerator from 'object-hash'
import React, {useEffect, useState} from 'react'
import isEqual from 'react-fast-compare'
import {StyleSheet, Text, View} from 'react-native'
import shortid from 'shortid'
import NodeView, {INode} from './NodeView'

const styles = StyleSheet.create({
    errorContainer: {
        borderColor: 'rgb(84, 85, 86)',
        backgroundColor: 'rgb(237, 57, 40)',
        borderWidth: 1,
        justifyContent: 'center',
        alignItems: 'center',
        height: 60,
    },
    errorText: {
        color: 'rgb(255, 255, 255)',
        fontSize: 17,
        fontWeight: 'bold',
    },
})

export interface IProps {
    data: any
    extraData?: any
    renderNode: (elem: INode, level?: number) => any
    onNodePressed?: (node?: INode) => void
    getChildrenName: (elem: any) => any
    style?: StyleSheet
    keepOpenedState?: boolean
}

export interface IState {
    root: INode
}

const NestedListView = React.memo(
    ({
        getChildrenName,
        renderNode,
        data,
        onNodePressed,
        extraData,
        keepOpenedState,
    }: IProps) => {
        const generateIds = (node?: INode) => {
            if (!node) {
                return {
                    _internalId: shortid.generate(),
                }
            }

            const childrenName: string = getChildrenName(node) || 'items'
            let children = node[childrenName]

            if (children) {
                if (!Array.isArray(children)) {
                    children = Object.keys(children).map(
                        (key: string) => children[key]
                    )
                }
                node[childrenName] = children.map((_: INode, index: number) =>
                    generateIds(children[index])
                )
            }
            if (node._internalId) {
                delete node._internalId
            }

            node._internalId = hashObjectGenerator(node, {
                algorithm: 'md5',
                encoding: 'base64',
            })

            return node
        }

        const generateRootNode = (props: IProps): INode => {
            return {
                _internalId: 'root',
                items: props.data
                    ? props.data.map((_: INode, index: number) =>
                          generateIds(props.data[index])
                      )
                    : [],
                name: 'root',
                opened: true,
                hidden: true,
            }
        }
        // tslint:disable-next-line:variable-name
        const [_root, setRoot]: [INode, (_root: INode) => void] = useState(
            generateRootNode({
                getChildrenName,
                renderNode,
                data,
                onNodePressed,
            })
        )

        useEffect(() => {
            setRoot(
                generateRootNode({
                    getChildrenName,
                    renderNode,
                    data,
                    onNodePressed,
                    extraData,
                })
            )
        }, [data, extraData, getChildrenName, renderNode, onNodePressed])
        // tslint:disable-next-line:variable-name
        const _getChildrenName = (node: INode) => {
            if (node.name === 'root') {
                return 'items'
            }

            return getChildrenName ? getChildrenName(node) : 'items'
        }

        const renderErrorMessage = (prop: string) => {
            return (
                <View style={styles.errorContainer}>
                    <Text style={styles.errorText}>
                        prop {prop} has not been passed
                    </Text>
                </View>
            )
        }

        if (!renderNode) {
            return renderErrorMessage('renderNode')
        }

        if (!data) {
            return renderErrorMessage('data')
        }

        return (
            <NodeView
                getChildrenName={_getChildrenName}
                node={_root}
                onNodePressed={onNodePressed}
                generateIds={generateIds}
                level={0}
                renderNode={renderNode}
                extraData={extraData}
                keepOpenedState={keepOpenedState}
            />
        )
    },
    isEqual
)

export default NestedListView
