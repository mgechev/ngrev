import { DataSet, Edge, Node, Options } from 'vis';

export interface NetworkConfig {
  title: string;
  nodes: Node[] | DataSet<Node>;
  edges: Edge[] | DataSet<Edge>;
  options: Options;
}
