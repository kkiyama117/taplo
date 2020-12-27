import React, { useEffect, useRef, useState } from "react";
import { Layout, Menu, Breadcrumb, Tooltip } from "antd";
import { graphql, useStaticQuery } from "gatsby";
import "../__generated__/gatsby-types";
import { AppHeader } from "./header";
import { MDXProvider } from "@mdx-js/react";
import "./doc-page-layout.scss";
import Highlight, { defaultProps } from "prism-react-renderer";
import theme from "prism-react-renderer/themes/github";
import { Helmet } from "react-helmet";

const CodeHighlight: React.FunctionComponent = props => {
  if (!(props.children as any).props) {
    return <pre {...props}></pre>;
  }

  const className = (props.children as any).props.className || "";
  const matches = className.match(/language-(?<lang>.*)/);
  return (
    <Highlight
      {...defaultProps}
      code={(props.children as any).props.children.trim()}
      language={
        matches && matches.groups && matches.groups.lang
          ? matches.groups.lang
          : ""
      }
      theme={theme}
    >
      {({ className, style, tokens, getLineProps, getTokenProps }) => (
        <pre className={className} style={{ ...style, padding: "20px" }}>
          {tokens.map((line, i) => (
            <div key={i} {...getLineProps({ line, key: i })}>
              {line.map((token, key) => (
                <span key={key} {...getTokenProps({ token, key })} />
              ))}
            </div>
          ))}
        </pre>
      )}
    </Highlight>
  );
};

const { SubMenu } = Menu;
const { Content, Sider } = Layout;

function locationWithoutHash() {
  return (
    location.protocol +
    "//" +
    location.host +
    location.pathname +
    (location.search ? location.search : "")
  );
}

const DocPage: React.FunctionComponent<any> = props => {
  const allPageMeta = useStaticQuery<GatsbyTypes.PageMetaQuery>(graphql`
    query PageMeta {
      allMdx {
        nodes {
          tableOfContents
          slug
          timeToRead
          frontmatter {
            title
          }
        }
      }
    }
  `);

  const pageMeta = allPageMeta.allMdx.nodes.find(
    n => "/" + n.slug === props.uri
  );

  const [selectedMenu, setSelectedMenu] = useState(undefined);

  const selectMenu = (value: string) => {
    history.pushState(null, null, value);
    setSelectedMenu(value);
  };

  const generateTree = (item: any) => ({
    title: item.title,
    key: item.url,
    children: item.items?.map(generateTree) ?? [],
  });

  const itemClicked = useRef(false);

  const scrollTo = (value: string) => {
    window.location.hash = value;
    itemClicked.current = true;
    setTimeout(() => {
      itemClicked.current = false;
    }, 200);
  };

  const createLink = (Tag: any) => (props: any) => {
    let ref = useRef<HTMLElement>();

    useEffect(() => {
      const listener = (ev: Event) => {
        if (!ref.current) {
          return;
        }

        const rect = ref.current.getBoundingClientRect();

        if (rect.top > 64 && rect.top < 100) {
          if (!itemClicked.current) {
            setTimeout(() => {
              selectMenu("#" + props.id);
            }, 100);
          }
        }
      };

      window.addEventListener("scroll", listener);

      return () => {
        window.removeEventListener("scroll", listener);
      };
    }, []);

    let [hashVisible, setHashVisible] = useState(false);

    return (
      <div
        onMouseOver={() => {
          setHashVisible(true);
        }}
        onMouseLeave={() => {
          setHashVisible(false);
        }}
      >
        <Tag
          id={(props as any).id}
          style={{
            display: "inline-block",
            scrollMarginTop: 80,
            position: "relative",
          }}
          ref={ref}
        >
          <Tooltip title="Copy Link">
            <span
              style={{
                opacity: hashVisible ? 1 : 0,
                cursor: "pointer",
                position: "absolute",
                top: "50%",
                left: 0,
                transform: "translate(-150%, -50%)",
                zIndex: 1,
              }}
              onClick={() => {
                navigator.clipboard.writeText(
                  `${locationWithoutHash()}#${(props as any).id}`
                );
              }}
            >
              #
            </span>
          </Tooltip>
          {props.children}
        </Tag>
      </div>
    );
  };

  const createComponents = () => {
    const components: { [key: string]: React.FunctionComponent } = {
      h1: createLink("h1"),
      h2: createLink("h2"),
      h3: createLink("h3"),
      h4: createLink("h4"),
      h5: createLink("h5"),
      h6: createLink("h6"),
      pre: CodeHighlight,
    };
    return components;
  };

  const buildMenuItem = (item: any, stop?: boolean) => {
    if (stop || (item.items?.length ?? 0) === 0) {
      return (
        <Menu.Item key={item.url} onClick={() => scrollTo(item.url)}>
          {item.title}
        </Menu.Item>
      );
    }

    return (
      <SubMenu
        key={item.url}
        title={item.title}
        onTitleClick={() => scrollTo(item.url)}
      >
        {item.items.map(item => buildMenuItem(item, true))}
      </SubMenu>
    );
  };

  return (
    <Layout style={{ minHeight: "100vh" }}>
      <Helmet title={`${pageMeta?.frontmatter.title} — Taplo`}></Helmet>
      <AppHeader
        path={props.uri}
        title={pageMeta?.frontmatter.title}
      ></AppHeader>
      <Layout>
        <Sider
          theme="light"
          width={230}
          style={{
            overflow: "auto",
            height: "100vh",
            position: "fixed",
            marginTop: 64,
            left: 0,
          }}
        >
          <Menu
            mode="inline"
            defaultOpenKeys={(pageMeta?.tableOfContents as any)?.items.map(
              item => item.url
            )}
            onSelect={e => {
              const elem = document.getElementById(e.key.toString().slice(1));

              let dims = elem.getBoundingClientRect();
              window.scrollTo(window.scrollX, dims.top + 100);

              setSelectedMenu(e.key);
            }}
            selectedKeys={[selectedMenu]}
          >
            {(pageMeta?.tableOfContents as any)?.items.map(item =>
              buildMenuItem(item)
            )}
          </Menu>
        </Sider>
        <Layout style={{ padding: "0 24px 24px" }}>
          <Content
            className="page-content"
            style={{
              backgroundColor: "#FFF",
              padding: 24,
              margin: 0,
              marginTop: 88,
              marginLeft: 230,
              minHeight: 280,
            }}
          >
            <MDXProvider components={createComponents()}>
              {props.children}
            </MDXProvider>
          </Content>
        </Layout>
      </Layout>
    </Layout>
  );
};

export default DocPage;